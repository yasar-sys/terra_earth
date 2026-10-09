import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayRunIdFetch, getLovableAiGatewayRunId, withLovableAiGatewayRunIdHeader } from "./ai-gateway-run-id.server";

export async function streamTerraEarthChat(request: Request, messages: UIMessage[], climateContext: string, onEnd: (messages: UIMessage[]) => Promise<void>) {
  const key = process.env['LOVABLE_API_KEY']!;
  if (!key) return new Response("Lovable AI is not configured.", { status: 401 });
  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  const provider = createOpenAI({ baseURL: "https://ai.gateway.lovable.dev/v1", apiKey: key, headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" }, fetch: runIdFetch.fetch });
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    messages: await convertToModelMessages(messages),
    abortSignal: request.signal,
    system: `You are Terra Earth's AI Evidence Lab, a careful bilingual research assistant for worldwide climate trends. Reply in the user's language. Be concise, precise, and understandable to students while remaining credible for scientific judges. Users may ask freely about any district(s) or variable; the server detects districts named in the newest user message and supplies their evidence. The SERVER-RECOMPUTED EVIDENCE below applies to the newest user message only; earlier assistant answers remain tied to the evidence available for their own turns. When a follow-up names a different district, treat it as a normal change of subject and answer for the newly named district. Never apologize, retract an earlier answer, or claim it used the wrong district merely because the newest turn selects a different district. Only acknowledge an actual earlier mistake when the user explicitly asks for a correction and the evidence for that earlier turn proves it was wrong. If the newest user message names no recognized district and the evidence uses Dhaka as an example, clearly say no district was recognized and ask the user to spell it as in the district list. For every numerical climate claim, use only the server-recomputed evidence below. Never invent, estimate, interpolate, or independently calculate a climate value. State the measured pattern first, then statistical strength, then possible explanations clearly labelled as hypotheses rather than causes, and finish with one useful follow-up comparison when relevant. Distinguish land-surface temperature from air temperature. If evidence_available is false, say exactly that the selected cached evidence is unavailable and do not substitute another district or period.\n\nSERVER-RECOMPUTED EVIDENCE FOR THE NEWEST USER MESSAGE ONLY:\n${climateContext}`,
    providerOptions: { openai: { forceReasoning: true, reasoningEffort: "medium", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] } },
  });
  const response = result.toUIMessageStreamResponse({ originalMessages: messages, sendReasoning: true, onEnd: async ({ messages: completed, isAborted }) => { if (!isAborted) await onEnd(completed); } });
  return withLovableAiGatewayRunIdHeader(response, runIdFetch);
}