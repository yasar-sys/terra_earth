import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { UIMessage } from "ai";
import type { Database } from "@/integrations/supabase/types";
import { streamTerraBanglaChat } from "@/lib/chat-gateway.server";

const variableSchema = z.enum(["ndvi", "lst", "temperature", "solar", "precipitation"]);
const bodySchema = z.object({
  conversationId: z.string().uuid(),
  messages: z.array(z.any()),
  districtId: z.string().min(1).max(80).optional(),
  variable: variableSchema.optional(),
  yearStart: z.number().int().min(1900).max(2100).optional(),
  yearEnd: z.number().int().min(1900).max(2100).optional(),
}).refine((value) => value.yearStart === undefined || value.yearEnd === undefined || value.yearStart <= value.yearEnd, {
  message: "The evidence period is invalid.",
});
const messageText = (message: UIMessage) => message.parts.filter((part) => part.type === "text").map((part) => part.text).join("\n").trim();

export const Route = createFileRoute("/api/chat")({
  server: { handlers: { POST: async ({ request }) => {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) return new Response("Sign in required.", { status: 401 });
    const url = process.env['SUPABASE_URL']!;
    const key = process.env['SUPABASE_PUBLISHABLE_KEY']!;
    const supabase = createClient<Database>(url, key, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
    const token = authorization.slice(7);
    const user = await supabase.auth.getUser(token);
    if (user.error || !user.data.user) return new Response("Sign in required.", { status: 401 });
    let body: z.infer<typeof bodySchema>;
    try { body = bodySchema.parse(await request.json()); } catch { return new Response("Invalid chat request.", { status: 400 }); }
    const messages = body.messages as UIMessage[];
    const conversation = await supabase.from("conversations").select("id,title").eq("id", body.conversationId).eq("user_id", user.data.user.id).maybeSingle();
    if (conversation.error || !conversation.data) return new Response("Conversation not found.", { status: 404 });

    const latestUser = [...messages].reverse().find((message) => message.role === "user");
    if (!latestUser) return new Response("Write a question first.", { status: 400 });
    const userText = messageText(latestUser).slice(0, 12000);
    const saved = await supabase.from("chat_messages").insert({ conversation_id: body.conversationId, user_id: user.data.user.id, role: "user", content: userText });
    if (saved.error) return new Response(saved.error.message, { status: 500 });

    if (conversation.data.title === "New climate question") {
      await supabase.from("conversations").update({ title: userText.slice(0, 64) || "Climate question" }).eq("id", body.conversationId);
    }

    const { districts, analyzeVariable, VARIABLE_KEYS } = await import("@/lib/climate");
    const normalized = userText.toLowerCase();
    const explicitDistrict = body.districtId ? districts.find((district) => district.id === body.districtId) : undefined;
    if (body.districtId && !explicitDistrict) return new Response("Unknown district selection.", { status: 400 });
    const mentioned = explicitDistrict ? [explicitDistrict] : districts.filter((district) => normalized.includes(district.name.toLowerCase()) || normalized.includes(district.id.replace(/-/g, " ")) || (district.bn && userText.includes(district.bn)));
    const chosenList = (mentioned.length ? mentioned : districts.filter((district) => district.id === "dhaka")).slice(0, 6);
    const range = body.yearStart !== undefined && body.yearEnd !== undefined ? { start: body.yearStart, end: body.yearEnd } : undefined;
    const variables = body.variable ? [body.variable] : VARIABLE_KEYS;
    const evidence = chosenList.map((chosen) => ({
      district: { id: chosen.id, name: chosen.name, name_bn: chosen.bn },
      facts: variables.map((variable) => analyzeVariable(chosen.id, variable, range)).flatMap((analysis) => analysis ? [{
        variable: analysis.variable,
        unit: analysis.unit,
        period: analysis.result.period,
        n_observations: analysis.result.n_observations,
        current: analysis.result.current_value,
        slope_per_year: analysis.result.slope.slope_per_year,
        slope_per_decade: analysis.result.slope.slope_per_decade,
        confidence_interval_95_per_year: [analysis.result.slope.ci_low, analysis.result.slope.ci_high],
        mann_kendall: { s: analysis.result.trend.s, z: analysis.result.trend.z, p_value: analysis.result.trend.p_value, significant_at_0_05: analysis.result.trend.significant_at_0_05, direction: analysis.result.trend.direction },
        provenance: analysis.provenance,
      }] : []),
    }));
    const climateContext = JSON.stringify({
      evidence_scope: "newest user message only; do not use it to judge or retract earlier turns",
      newest_user_message: userText,
      mode: explicitDistrict ? "scope set by the user's filters" : "open question: districts detected from the user's message (Dhaka used as an example only if none was named)",
      districts_detected_from_question: !explicitDistrict && mentioned.length > 0,
      selected_variable: body.variable ?? "all available variables",
      selected_period: range ?? "full cached period",
      evidence_available: evidence.some((item) => item.facts.length > 0),
      server_recomputed_evidence: evidence,
    });

    return streamTerraBanglaChat(request, messages, climateContext, async (completed) => {
      const assistant = [...completed].reverse().find((message) => message.role === "assistant");
      const content = assistant ? messageText(assistant).slice(0, 12000) : "";
      if (!content) return;
      const inserted = await supabase.from("chat_messages").insert({ conversation_id: body.conversationId, user_id: user.data.user.id, role: "assistant", content, model: "openai/gpt-6-astra" });
      if (inserted.error) console.error("Could not save assistant reply", inserted.error.message);
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", body.conversationId);
    });
  } } },
});