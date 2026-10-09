import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  districtId: z.string(),
  variable: z.enum(["ndvi", "lst", "temperature", "solar", "precipitation"]),
  start: z.number().int(),
  end: z.number().int(),
  observation: z.string(),
  lang: z.enum(["en", "bn"]),
});

export const explainStudentTrend = createServerFn({ method: "POST" })
  .inputValidator((input) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    const observation = data.observation.trim();
    if (observation.length < 8 || observation.length > 800) {
      throw new Error("Describe your observation in 8–800 characters.");
    }

    const { analyzeVariable, getDistrict, VARIABLE_LABEL_KEY } = await import("./climate");
    const { ensureGlobalEvidence } = await import("./global-climate.server");
    await ensureGlobalEvidence(data.districtId, data.variable === "ndvi" || data.variable === "lst");
    const district = getDistrict(data.districtId);
    const analysis = analyzeVariable(data.districtId, data.variable, {
      start: Math.min(data.start, data.end),
      end: Math.max(data.start, data.end),
    });
    if (!district || !analysis) {
      throw new Error("Cached NASA data is not available for that selection.");
    }

    const key = process.env['LOVABLE_API_KEY']!;
    if (!key) throw new Error("Lovable AI is not configured for this project.");

    const [{ createOpenAI }, { streamText }, { createGatewayFetch }] = await Promise.all([
      import("@ai-sdk/openai"),
      import("ai"),
      import("./ai-gateway-run-id.server"),
    ]);
    const gateway = createGatewayFetch();
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey: key,
      headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: gateway.fetch,
    });
    const facts = {
      location: {name: district.name, latitude: district.lat, longitude: district.lon, sample_scope: "representative coordinate, not national average"},
      variable: VARIABLE_LABEL_KEY[data.variable],
      unit: analysis.unit,
      period: analysis.result.period,
      observations: analysis.result.n_observations,
      first_value: analysis.result.first_value,
      latest_value: analysis.result.current_value,
      slope_per_decade: analysis.result.slope.slope_per_decade,
      confidence_interval_per_decade: [
        analysis.result.slope.ci_low * 10,
        analysis.result.slope.ci_high * 10,
      ],
      mann_kendall: analysis.result.trend,
      provenance: analysis.provenance,
    };
    const language = data.lang === "bn" ? "Bangla" : "English";
    const result = streamText({
      model: provider.responses("openai/gpt-6-astra"),
      system: `You are a careful Earth-science coach for students aged 8–18. Answer in ${language}. Use only the supplied computed evidence for numerical claims. Never calculate, change, or invent a value. Clearly distinguish measured evidence from plausible mechanisms. Never claim causation from a trend. State that measurements describe the supplied point, not a whole country. If the student's claim conflicts with the evidence, say so kindly. Keep the answer under 230 words. Use exactly these short headings: Evidence, Possible explanation, Follow-up comparison. The follow-up must name one useful worldwide location comparison and one variable, but must not invent that location's result. Mention that the comparison should be checked in the app.`,
      prompt: `Student observation: ${observation}\n\nComputed evidence (authoritative JSON):\n${JSON.stringify(facts)}`,
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "medium",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });

    const text = await result.text;
    if (!text.trim()) throw new Error("Lovable AI returned no explanation. Please try a new observation.");
    return { text, facts };
  });