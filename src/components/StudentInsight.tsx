import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BrainCircuit, Bookmark, Lightbulb, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { explainStudentTrend } from "@/lib/trend-insight.functions";
import { type VariableKey } from "@/lib/climate";
import { useLang } from "@/lib/i18n";
import { saveStudentInsight } from "@/lib/learning.functions";
import { supabase } from "@/integrations/supabase/client";

export function StudentInsight({
  districtId,
  variable,
  start,
  end,
  onResult,
}: {
  districtId: string;
  variable: VariableKey;
  start: number;
  end: number;
  onResult?: (text: string) => void;
}) {
  const { lang } = useLang();
  const L = (en: string, bn: string) => (lang === "bn" ? bn : en);
  const explain = useServerFn(explainStudentTrend);
  const saveInsight = useServerFn(saveStudentInsight);
  const [observation, setObservation] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saveState, setSaveState] = useState("");

  function renderedAnswer(text: string) {
    return text.split(/\n+/).filter(Boolean).map((line, index) => {
      const clean = line.replace(/^#{1,3}\s*/, "").replace(/\*\*/g, "");
      const heading = /^#{1,3}\s/.test(line) || /^(Evidence|Possible explanation|Follow-up comparison|প্রমাণ|সম্ভাব্য ব্যাখ্যা|পরবর্তী তুলনা)/i.test(clean);
      return heading ? (
        <h3 key={`${index}-${clean}`} className="mt-4 text-sm font-semibold text-accent first:mt-0">{clean}</h3>
      ) : (
        <p key={`${index}-${clean}`} className="mt-2 text-sm leading-7 text-foreground">{clean}</p>
      );
    });
  }

  async function submit() {
    setError("");
    setLoading(true);
    try {
      const result = await explain({ data: { districtId, variable, start, end, observation, lang } });
      setAnswer(result.text);
      onResult?.(result.text);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : L("The explanation could not be generated.", "ব্যাখ্যা তৈরি করা যায়নি।"));
    } finally {
      setLoading(false);
    }
  }

  async function saveAnswer() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) { sessionStorage.setItem("terrabangla-auth-next", window.location.pathname); window.location.assign("/auth"); return; }
    setSaveState(L("Saving…", "সেভ হচ্ছে…"));
    try { await saveInsight({ data: { districtId, variable, start, end, observation, explanation: answer } }); setSaveState(L("Saved to your profile.", "তোমার প্রোফাইলে সেভ হয়েছে।")); } catch { setSaveState(L("Could not save this explanation.", "ব্যাখ্যাটি সেভ করা যায়নি।")); }
  }

  return (
    <section className="insight-panel mt-6 overflow-hidden" aria-labelledby="insight-title">
      <div className="grid gap-0 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="border-b border-border p-5 lg:border-b-0 lg:border-r sm:p-6">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase text-accent">
            <BrainCircuit aria-hidden /> {L("Student investigation", "শিক্ষার্থী অনুসন্ধান")}
          </p>
          <h2 id="insight-title" className="mt-3 font-display text-2xl text-foreground">
            {L("What trend did you notice?", "তুমি কোন প্রবণতা লক্ষ্য করেছ?")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {L(
              "Describe what you see. Lovable AI will compare your idea with the displayed NASA statistics and suggest what to investigate next.",
              "তুমি কী দেখছ তা লেখো। Lovable AI তোমার ধারণাকে দেখানো নাসা পরিসংখ্যানের সঙ্গে মিলিয়ে পরের অনুসন্ধান সাজেস্ট করবে।",
            )}
          </p>
          <label className="mt-4 block text-sm font-medium text-foreground" htmlFor="student-observation">
            {L("Your observation", "তোমার পর্যবেক্ষণ")}
          </label>
          <Textarea
            id="student-observation"
            value={observation}
            onChange={(event) => setObservation(event.target.value.slice(0, 800))}
            placeholder={L("Example: The temperature seems to rise over time…", "উদাহরণ: সময়ের সাথে তাপমাত্রা বাড়ছে মনে হচ্ছে…")}
            className="mt-2 min-h-28 resize-y bg-background/70"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">{observation.length}/800</span>
            <Button onClick={submit} disabled={loading || observation.trim().length < 8}>
              {loading ? <LoaderCircle className="animate-spin" aria-hidden /> : <Lightbulb aria-hidden />}
              {loading ? L("Checking evidence…", "প্রমাণ যাচাই হচ্ছে…") : L("Explain with data", "উপাত্ত দিয়ে ব্যাখ্যা করো")}
            </Button>
          </div>
          {error ? <p role="alert" className="mt-3 text-sm text-declining">{error}</p> : null}
        </div>
        <div className="min-h-64 p-5 sm:p-6" aria-live="polite">
          <p className="text-xs font-semibold uppercase text-primary">{L("Data-backed interpretation", "উপাত্তভিত্তিক ব্যাখ্যা")}</p>
          {answer ? (
            <div className="mt-3">{renderedAnswer(answer)}<div className="mt-5 flex flex-wrap items-center gap-3"><Button type="button" variant="outline" onClick={saveAnswer}><Bookmark/>{L("Save to profile", "প্রোফাইলে সেভ করো")}</Button>{saveState ? <span className="text-xs text-muted-foreground" role="status">{saveState}</span> : null}</div></div>
          ) : (
            <div className="flex min-h-48 items-center justify-center border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
              {L("Your explanation will appear here. Scientific values always come from the app’s calculations, never from AI.", "তোমার ব্যাখ্যা এখানে আসবে। বৈজ্ঞানিক মান সবসময় অ্যাপের গণনা থেকে আসে, AI থেকে নয়।")}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}