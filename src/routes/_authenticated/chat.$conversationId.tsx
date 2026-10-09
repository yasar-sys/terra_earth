import { LocationSearch } from "@/components/LocationSearch";
import { useLocationEvidence } from "@/lib/location-evidence";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { BarChart3, Database, FlaskConical, LockKeyhole, Plus, Satellite, Trash2 } from "lucide-react";
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { createConversation, deleteConversation, listConversations, loadConversation } from "@/lib/chat.functions";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { analyzeVariable, districts, getDistrict, getSeries, VARIABLE_KEYS, yearBounds, type VariableKey } from "@/lib/climate";
import { ProvenanceButton } from "@/components/ProvenanceDrawer";
import terraBanglaLogo from "@/assets/brand/terrabangla-logo.png.asset.json";

const VARIABLE_NAMES: Record<VariableKey, { en: string; bn: string }> = {
  ndvi: { en: "Vegetation (NDVI)", bn: "সবুজতা (NDVI)" },
  lst: { en: "Land surface temperature", bn: "ভূ-পৃষ্ঠের তাপমাত্রা" },
  temperature: { en: "Air temperature", bn: "বায়ুর তাপমাত্রা" },
  solar: { en: "Solar radiation", bn: "সৌর বিকিরণ" },
  precipitation: { en: "Precipitation", bn: "বৃষ্টিপাত" },
};

export const Route = createFileRoute("/_authenticated/chat/$conversationId")({
  head: () => ({ meta: [
    { title: "Climate conversation — Terra Earth" }, { name: "description", content: "A saved Terra Earth climate conversation." },
    { property: "og:title", content: "Climate conversation — Terra Earth" }, { property: "og:description", content: "Ask questions grounded in NASA evidence worldwide." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: ChatThread,
});

function ChatThread() {
  const { conversationId } = Route.useParams(); const { lang } = useLang(); const navigate = useNavigate();
  const [initial, setInitial] = useState<UIMessage[] | null>(null); const [threads, setThreads] = useState<Array<{ id: string; title: string }>>([]); const [error, setError] = useState("");
  useEffect(() => { Promise.all([loadConversation({ data: { conversationId } }), listConversations()]).then(([thread, list]) => { setInitial(thread.messages as UIMessage[]); setThreads(list); }).catch((e) => setError(e instanceof Error ? e.message : String(e))); }, [conversationId]);
  async function newThread() { const item = await createConversation({ data: {} }); await navigate({ to: "/chat/$conversationId", params: { conversationId: item.id } }); }
  async function removeThread(id: string) { await deleteConversation({ data: { conversationId: id } }); const rest = await listConversations(); if (!rest.length) return newThread(); await navigate({ to: "/chat/$conversationId", params: { conversationId: rest[0]!.id } }); }
  if (!initial) return <div className="mx-auto min-h-[60vh] max-w-5xl px-4 py-10">{error ? <p role="alert" className="text-destructive">{error}</p> : <Shimmer>{lang === "bn" ? "কথোপকথন খুলছি…" : "Opening conversation…"}</Shimmer>}</div>;
  return <div className="mx-auto grid min-h-[70vh] max-w-[1500px] gap-4 px-3 py-5 sm:px-6 lg:grid-cols-[250px_1fr]">
    <aside className="panel h-fit p-3 lg:sticky lg:top-24"><div className="mb-3 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-[.14em] text-accent"><FlaskConical className="h-4 w-4" />{lang === "bn" ? "গবেষণা নোটবুক" : "Research notebook"}</div><Button className="w-full" onClick={newThread}><Plus />{lang === "bn" ? "নতুন আলোচনা" : "New conversation"}</Button><div className="mt-3 space-y-1">{threads.map((thread) => <div key={thread.id} className="flex items-center gap-1"><Link to="/chat/$conversationId" params={{ conversationId: thread.id }} className={`min-w-0 flex-1 truncate rounded-lg px-3 py-2 text-sm transition-colors ${thread.id === conversationId ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>{thread.title}</Link><Button size="icon-sm" variant="ghost" aria-label={lang === "bn" ? "আলোচনা মুছুন" : "Delete conversation"} onClick={() => void removeThread(thread.id)}><Trash2 /></Button></div>)}</div></aside>
    <ChatPanel key={conversationId} conversationId={conversationId} initialMessages={initial} lang={lang} />
  </div>;
}

function ChatPanel({ conversationId, initialMessages, lang }: { conversationId: string; initialMessages: UIMessage[]; lang: "en" | "bn" }) {
  const inputRef = useRef<HTMLTextAreaElement>(null); const [input, setInput] = useState(""); const [errorText, setErrorText] = useState("");
  const globalBounds = {min:2015,max:2024};
  const [districtId, setDistrictId] = useState("auto");
  const [variable, setVariable] = useState<VariableKey | "all">("all");
  const isFree = districtId === "auto";
  const previewDistrict = isFree ? "dhaka" : districtId;
  const locationEvidence = useLocationEvidence(previewDistrict, variable === "ndvi" || variable === "lst");
  const previewVariable: VariableKey = variable === "all" ? "temperature" : variable;
  const selectedSeries = useMemo(() => getSeries(previewDistrict, previewVariable), [previewDistrict, previewVariable, locationEvidence.version]);
  const availableYears = selectedSeries.map((point) => point.year);
  const minYear = availableYears[0] ?? globalBounds.min;
  const maxYear = availableYears[availableYears.length - 1] ?? globalBounds.max;
  const [yearStart, setYearStart] = useState(minYear);
  const [yearEnd, setYearEnd] = useState(maxYear);
  useEffect(() => { setYearStart(minYear); setYearEnd(maxYear); }, [minYear, maxYear]);
  const range = { start: Math.min(yearStart, yearEnd), end: Math.max(yearStart, yearEnd) };
  const analysis = useMemo(() => isFree ? null : analyzeVariable(previewDistrict, previewVariable, range), [isFree, previewDistrict, previewVariable, range.start, range.end, locationEvidence.version]);
  const district = getDistrict(districtId);
  const requestScope = isFree ? {} : { districtId, ...(variable === "all" ? {} : { variable }), yearStart: range.start, yearEnd: range.end };
  const L = (en: string, bn: string) => lang === "bn" ? bn : en;
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat", body: { conversationId, ...requestScope }, headers: async () => { const { data } = await supabase.auth.getSession(); return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {}; } }), [conversationId, isFree, districtId, variable, range.start, range.end]);
  const { messages, sendMessage, status, stop } = useChat({ id: conversationId, messages: initialMessages, transport, onError: (error) => setErrorText(error.message), onFinish: () => { inputRef.current?.focus(); } });
  const busy = status === "submitted" || status === "streaming";
  const years = Array.from({ length: Math.max(1, maxYear - minYear + 1) }, (_, index) => minYear + index);
  const direction = analysis?.result.trend.direction;
  const directionLabel = direction === "increasing" ? L("increasing", "বাড়ছে") : direction === "decreasing" ? L("decreasing", "কমছে") : L("no clear trend", "স্পষ্ট প্রবণতা নেই");
  return <section className="evidence-lab flex min-h-[720px] flex-col overflow-hidden rounded-xl">
    <header className="border-b border-border px-4 py-4 sm:px-5"><div className="flex items-start gap-3"><img src={terraBanglaLogo.url} alt="" className="h-11 w-11 shrink-0 object-contain drop-shadow-[0_0_12px_var(--primary-glow)]" /><div><p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.15em] text-accent"><Satellite className="h-3.5 w-3.5" />{L("Server-grounded workspace", "সার্ভার-ভিত্তিক গবেষণাগার")}</p><h1 className="mt-1 font-display text-2xl">{L("AI Evidence Lab", "এআই প্রমাণ গবেষণাগার")}</h1><p className="mt-1 text-xs text-muted-foreground">{L("Ask freely about any location or variable — or narrow the scope with the filters. AI explains; deterministic code computes every number.", "যেকোনো জেলা বা সূচক নিয়ে সরাসরি প্রশ্ন করুন — চাইলে ফিল্টার দিয়ে সীমা ঠিক করুন। এআই ব্যাখ্যা করে; প্রতিটি সংখ্যা নির্ধারিত কোড হিসাব করে।")}</p></div></div></header>
    <div className="grid min-h-0 flex-1 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="flex min-h-[560px] min-w-0 flex-col border-border xl:border-r">
        <div className="grid gap-2 border-b border-border bg-elevated/40 p-3 sm:grid-cols-2 lg:grid-cols-4" aria-label={L("Evidence controls", "প্রমাণ নিয়ন্ত্রণ")}>
          <LocationSearch onSelect={setDistrictId} />
          <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{L("Location", "স্থান")}<select className="mt-1 h-10 w-full border border-input bg-card px-3 text-sm" value={districtId} onChange={(event) => setDistrictId(event.target.value)} disabled={busy}><option value="auto">{L("Any — detect from my question", "যেকোনো — প্রশ্ন থেকে বুঝে নাও")}</option>{[...districts,...(district && !districts.some(d=>d.id===district.id) ? [district] : [])].map((item) => <option key={item.id} value={item.id}>{lang === "bn" ? item.bn : item.name}</option>)}</select></label>
          <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{L("Variable", "সূচক")}<select className="mt-1 h-10 w-full border border-input bg-card px-3 text-sm" value={variable} onChange={(event) => setVariable(event.target.value as VariableKey | "all")} disabled={busy}><option value="all">{L("All variables", "সব সূচক")}</option>{VARIABLE_KEYS.map((key) => <option key={key} value={key}>{lang === "bn" ? VARIABLE_NAMES[key].bn : VARIABLE_NAMES[key].en}</option>)}</select></label>
          <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{L("Start year", "শুরুর বছর")}<select className="mt-1 h-10 w-full border border-input bg-card px-3 text-sm" value={yearStart} onChange={(event) => setYearStart(Number(event.target.value))} disabled={busy || isFree}>{years.map((year) => <option key={year}>{year}</option>)}</select></label>
          <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{L("End year", "শেষ বছর")}<select className="mt-1 h-10 w-full border border-input bg-card px-3 text-sm" value={yearEnd} onChange={(event) => setYearEnd(Number(event.target.value))} disabled={busy || isFree}>{years.map((year) => <option key={year}>{year}</option>)}</select></label>
        </div>
        <Conversation><ConversationContent className="px-4 sm:px-6">{messages.length === 0 ? <ConversationEmptyState icon={<img src={terraBanglaLogo.url} alt="" className="h-20 w-20 object-contain drop-shadow-[0_0_18px_var(--primary-glow)]" />} title={L("Investigate the selected evidence", "নির্বাচিত প্রমাণ অনুসন্ধান করুন")} description={L("Ask what changed, whether it is significant, what it may mean, or which comparison to try next.", "কী বদলেছে, তা তাৎপর্যপূর্ণ কি না, এর সম্ভাব্য অর্থ বা পরের তুলনা কী হতে পারে—জিজ্ঞেস করুন।")} /> : messages.map((message) => <Message from={message.role} key={message.id}><MessageContent className={message.role === "user" ? "border border-primary/30 bg-primary text-primary-foreground shadow-glow" : "max-w-3xl"}>{message.parts.map((part, index) => part.type === "text" ? <MessageResponse key={index}>{part.text}</MessageResponse> : null)}</MessageContent></Message>)}{status === "submitted" ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><img src={terraBanglaLogo.url} alt="" className="h-7 w-7 object-contain" /><Shimmer>{L("Recomputing the selected evidence…", "নির্বাচিত প্রমাণ আবার হিসাব করছি…")}</Shimmer></div> : null}</ConversationContent><ConversationScrollButton /></Conversation>
        <div className="border-t border-border bg-card/55 p-3 backdrop-blur-xl"><div className="mb-2 flex flex-wrap gap-2"><button type="button" className="evidence-chip rounded-full px-3 py-1 text-xs" onClick={() => setInput(L("Explain this trend in simple language and state whether it is statistically significant.", "এই প্রবণতা সহজ ভাষায় ব্যাখ্যা করুন এবং এটি পরিসংখ্যানগতভাবে তাৎপর্যপূর্ণ কি না বলুন।"))}>{L("Explain the trend", "প্রবণতা ব্যাখ্যা")}</button><button type="button" className="evidence-chip rounded-full px-3 py-1 text-xs" onClick={() => setInput(L("What can and cannot be concluded from this evidence?", "এই প্রমাণ থেকে কী সিদ্ধান্ত নেওয়া যায় এবং কী যায় না?"))}>{L("Check the claim", "দাবি যাচাই")}</button><button type="button" className="evidence-chip rounded-full px-3 py-1 text-xs" onClick={() => setInput(L("Suggest one useful follow-up comparison and explain why.", "একটি উপকারী পরবর্তী তুলনা প্রস্তাব করুন এবং কেন তা বলুন।"))}>{L("Plan a comparison", "তুলনা পরিকল্পনা")}</button></div><PromptInput onSubmit={({ text }) => { const clean = text.trim(); if (!clean || busy) return; setErrorText(""); void sendMessage({ text: clean }); setInput(""); }}><PromptInputTextarea ref={inputRef} autoFocus value={input} onChange={(e) => setInput(e.target.value)} placeholder={L("Ask anything — e.g. How is rainfall changing in Mymensingh?", "যেকোনো প্রশ্ন করুন — যেমন ময়মনসিংহে বৃষ্টিপাত কেমন বদলাচ্ছে?")} /><PromptInputFooter className="justify-between"><span className="flex items-center gap-1 text-[10px] text-muted-foreground"><LockKeyhole className="h-3 w-3" />{L("No client-supplied climate values", "ক্লায়েন্ট থেকে জলবায়ু সংখ্যা পাঠানো হয় না")}</span><PromptInputSubmit status={status} disabled={!input.trim() && !busy} onStop={stop} /></PromptInputFooter></PromptInput>{errorText ? <p role="alert" className="mt-2 text-xs text-destructive">{errorText}</p> : null}</div>
      </div>
      <aside className="bg-elevated/35 p-4"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.12em] text-accent"><Database className="h-4 w-4" />{L("Active evidence", "সক্রিয় প্রমাণ")}</p><h2 className="mt-3 text-xl">{isFree ? L("Open question mode", "মুক্ত প্রশ্ন মোড") : district ? (lang === "bn" ? district.bn : district.name) : districtId}</h2><p className="mt-1 text-sm text-muted-foreground">{variable === "all" ? L("All variables", "সব সূচক") : (lang === "bn" ? VARIABLE_NAMES[variable].bn : VARIABLE_NAMES[variable].en)}{isFree ? "" : ` · ${range.start}–${range.end}`}</p>{isFree ? <div className="mt-5 rounded-lg border border-border p-4 text-sm leading-6 text-muted-foreground">{L("Name any locations in your question (one or several). The server finds them, reloads their cached NASA records and recomputes the statistics for every variable before AI answers.", "প্রশ্নে যেকোনো এক বা একাধিক জেলার নাম লিখুন। সার্ভার সেগুলো খুঁজে সংরক্ষিত NASA তথ্য লোড করে প্রতিটি সূচকের পরিসংখ্যান আবার হিসাব করে, তারপর এআই উত্তর দেয়।")}</div> : analysis ? <><div className="mt-5 grid grid-cols-2 gap-2"><EvidenceStat label={L("Current", "বর্তমান")} value={`${analysis.result.current_value?.toLocaleString(lang === "bn" ? "bn-BD" : "en-US", { maximumFractionDigits: 2 })} ${analysis.unit}`} /><EvidenceStat label={L("Observations", "পর্যবেক্ষণ")} value={String(analysis.result.n_observations)} /><EvidenceStat label={L("Per decade", "প্রতি দশকে")} value={`${analysis.result.slope.slope_per_decade.toLocaleString(lang === "bn" ? "bn-BD" : "en-US", { maximumFractionDigits: 3 })} ${analysis.unit}`} /><EvidenceStat label="p-value" value={analysis.result.trend.p_value.toFixed(4)} /></div><div className="mt-3 rounded-lg border border-border p-3"><p className="flex items-center gap-2 text-xs font-semibold"><BarChart3 className="h-4 w-4 text-accent" />{analysis.result.trend.significant_at_0_05 ? L("Statistically significant", "পরিসংখ্যানগতভাবে তাৎপর্যপূর্ণ") : L("Not statistically significant", "পরিসংখ্যানগতভাবে তাৎপর্যপূর্ণ নয়")}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{L("Mann–Kendall direction", "ম্যান–কেন্ডাল দিক")}: {directionLabel}</p></div><div className="mt-3"><ProvenanceButton provenance={analysis.provenance} payload={analysis} title={`${district?.name ?? districtId} · ${previewVariable}`} /></div></> : <div className="mt-5 rounded-lg border border-border p-4 text-sm text-muted-foreground">{L("Data not yet available for this selection.", "এই নির্বাচনের তথ্য এখনও পাওয়া যায়নি।")}</div>}<div className="mt-5 border-t border-border pt-4 text-xs leading-5 text-muted-foreground"><p className="flex items-center gap-2 font-semibold text-foreground"><LockKeyhole className="h-3.5 w-3.5 text-accent" />{L("Grounding contract", "প্রমাণভিত্তিক চুক্তি")}</p><p className="mt-2">{L("The server validates this scope, reloads cached NASA observations, and recomputes Mann–Kendall and Theil–Sen statistics before AI receives any evidence.", "সার্ভার এই পরিসর যাচাই করে, সংরক্ষিত NASA পর্যবেক্ষণ পুনরায় লোড করে এবং এআইকে প্রমাণ দেওয়ার আগে Mann–Kendall ও Theil–Sen পরিসংখ্যান পুনরায় হিসাব করে।")}</p></div></aside>
    </div>
  </section>;
}

function EvidenceStat({ label, value }: { label: string; value: string }) {
  return <div className="evidence-stat rounded-lg p-3"><span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span><strong className="mt-1 block break-words text-sm text-foreground">{value}</strong></div>;
}