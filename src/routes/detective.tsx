import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from "recharts";
import { Download, FileText, Gavel, LoaderCircle, Play, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocationSearch } from "@/components/LocationSearch";
import { getDistrict } from "@/lib/climate";
import { analyzeSeries, linearRegression } from "@/lib/stats";
import { CURIOSITIES, DEMOS, JUDGE_DEMO, suggestVariables, type Curiosity, type DetectiveDemo, DETECTIVE_VARIABLES, DETECTIVE_VARIABLE_KEYS, ENVIRONMENTS, POWER_FIRST_YEAR, POWER_LAST_YEAR, SEASONS, seasonalSeries, trendSentence, type DetectiveVariable, type Environment } from "@/lib/detective";
import { loadDetectiveSeries } from "@/lib/detective.functions";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/detective")({
  head: () => ({
    meta: [
      { title: "Trend Detective — Terra Earth" },
      { name: "description", content: "Pick any place, a NASA variable, a season and years, then test whether the change is a statistically significant trend with Mann-Kendall, linear regression and confidence intervals." },
      { property: "og:title", content: "Trend Detective — Terra Earth" },
      { property: "og:description", content: "Be an Earth system trend detective with NASA data: what is changing, where, how much, and is it significant?" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DetectivePage,
});

interface Place { name: string; lat: number; lon: number }
interface Run { place: Place; variable: DetectiveVariable; season: string; start: number; end: number; scope: Scope; region?: string; regionName?: string | null; monthly: Record<string, number>; provenance: { dataset_id: string; source_url: string; retrieved: string } | null; error: string | null; cells: number }
type Scope = "point" | "area" | "region";

const years = Array.from({ length: POWER_LAST_YEAR - POWER_FIRST_YEAR + 1 }, (_, i) => POWER_FIRST_YEAR + i);
const selectCls = "mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground";

function DetectivePage() {
  const { lang } = useLang();
  const bn = lang === "bn";
  const load = useServerFn(loadDetectiveSeries);
  const [env, setEnv] = useState<Environment | null>(null);
  const [place, setPlace] = useState<Place>({ name: "Dhaka", lat: 23.8103, lon: 90.4125 });
  const [variable, setVariable] = useState<DetectiveVariable>("T2M");
  const [season, setSeason] = useState("annual");
  const [start, setStart] = useState(1981);
  const [end, setEnd] = useState(2024);
  const [scope, setScope] = useState<Scope>("point");
  const [region, setRegion] = useState("");
  const [curiosity, setCuriosity] = useState<Curiosity | null>(null);
  const [judgeStep, setJudgeStep] = useState(0);
  const pdfLib = useRef<typeof import("jspdf") | null>(null);
  useEffect(() => { void import("jspdf").then((m) => { pdfLib.current = m; }); }, []);
  const [busy, setBusy] = useState(false);
  const [run, setRun] = useState<Run | null>(null);

  async function investigate(p = place, v = variable, s = season, a = start, b = end, sc = scope, rg = region) {
    setBusy(true);
    const base = { place: sc === "region" ? { ...p, name: rg || p.name } : p, variable: v, season: s, start: a, end: b, scope: sc, region: rg };
    try {
      const r = await load({ data: { variable: v, lat: p.lat, lon: p.lon, scope: sc, region: sc === "region" ? rg : undefined } });
      setRun({ ...base, ...r });
    } catch {
      setRun({ ...base, monthly: {}, provenance: null, error: "NASA POWER could not be reached. No values were estimated.", cells: 0 });
    } finally { setBusy(false); }
  }

  function playDemo(d: DetectiveDemo) {
    const p = { name: d.place, lat: d.lat, lon: d.lon };
    const sc = d.scope ?? "point";
    setPlace(p); setVariable(d.variable); setSeason(d.season); setStart(d.start); setEnd(d.end); setScope(sc); setRegion(d.region ?? "");
    void investigate(p, d.variable, d.season, d.start, d.end, sc, d.region ?? "");
  }

  async function playJudge() {
    setJudgeStep(1);
    for (let i = 2; i <= 3; i += 1) { await new Promise((r) => setTimeout(r, 700)); setJudgeStep(i); }
    playDemo(JUDGE_DEMO);
    setJudgeStep(4);
  }
  useEffect(() => { if (judgeStep === 4 && !busy && run?.place.name === JUDGE_DEMO.region) setJudgeStep(5); }, [judgeStep, busy, run]);

  const analysis = useMemo(() => {
    if (!run || run.error) return null;
    const series = seasonalSeries(run.monthly, SEASONS[run.season]!.months, run.start, run.end);
    const mk = analyzeSeries(series);
    const ols = linearRegression(series.map((p) => p.year), series.map((p) => p.value));
    const chart = series.map((p) => ({
      year: p.year, value: Number(p.value.toFixed(4)),
      ols: ols ? Number((ols.intercept + ols.slope_per_year * p.year).toFixed(4)) : undefined,
      sen: mk ? Number((mk.slope.intercept + mk.slope.slope_per_year * p.year).toFixed(4)) : undefined,
    }));
    return { series, mk, ols, chart };
  }, [run]);

  const meta = run ? DETECTIVE_VARIABLES[run.variable] : null;
  const scopeLabel = run ? (run.scope === "region" ? `Mean of ${run.cells} NASA POWER cells inside ${run.regionName ?? run.region} (a sampled regional average)` : run.scope === "area" ? `Area mean of ${run.cells} NASA POWER cells (±1°)` : "Single NASA POWER cell — a point observation, not a national average") : "";
  const sentence = run && meta && analysis?.mk ? trendSentence({ label: meta.label, unit: meta.unit, season: SEASONS[run.season]!.label, place: run.place.name, direction: analysis.mk.trend.direction, perDecade: analysis.mk.slope.slope_per_decade, p: analysis.mk.trend.p_value, n: analysis.mk.n_observations }) : "";

  function exportCsv() {
    if (!run || !analysis || !meta) return;
    const rows = [["place", "lat", "lon", "scope", "variable", "unit", "season", "year", "value", "dataset_id", "source_url", "retrieved"], ...analysis.series.map((p) => [run.place.name, run.place.lat, run.place.lon, run.scope, run.variable, meta.unit, run.season, p.year, p.value, run.provenance?.dataset_id ?? "", run.provenance?.source_url ?? "", run.provenance?.retrieved ?? ""])];
    const blob = new Blob([rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `terra-earth-trend-${run.variable}-${run.season}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }

  function exportPdf() {
    if (!run || !analysis?.mk || !meta || !pdfLib.current) return;
    const { jsPDF } = pdfLib.current;
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const mk = analysis.mk, ols = analysis.ols;
    const lines = [
      "Terra Earth — Trend Detective report", "",
      `Place: ${run.place.name}${run.scope === "region" ? "" : ` (${run.place.lat.toFixed(3)}, ${run.place.lon.toFixed(3)})`}`, ...pdf.splitTextToSize(`Spatial scope: ${scopeLabel}`, 180),
      `Variable: ${meta.label} [${meta.unit}] — ${meta.source}`,
      `Season: ${SEASONS[run.season]!.label}   Years: ${mk.period.start}–${mk.period.end} (${mk.n_observations} complete years)`, "",
      `Mann-Kendall: direction ${mk.trend.direction}, tau ${mk.trend.tau.toFixed(3)}, Z ${mk.trend.z.toFixed(3)}, p ${mk.trend.p_value.toFixed(4)}`,
      `Theil-Sen slope: ${mk.slope.slope_per_decade.toFixed(4)} ${meta.unit}/decade (95% CI ${(mk.slope.ci_low * 10).toFixed(4)} to ${(mk.slope.ci_high * 10).toFixed(4)})`,
      ols ? `Linear regression: ${ols.slope_per_decade.toFixed(4)} ${meta.unit}/decade, t ${ols.t_statistic.toFixed(3)} (df ${ols.degrees_of_freedom}), p ${ols.p_value.toFixed(4)}, R² ${ols.r_squared.toFixed(3)}` : "",
      ols ? `95% confidence interval (t): ${ols.ci95_low_per_decade.toFixed(4)} to ${ols.ci95_high_per_decade.toFixed(4)} ${meta.unit}/decade` : "", "",
      "Key finding:", ...pdf.splitTextToSize(sentence, 180), "",
      "Data (year: value):", ...pdf.splitTextToSize(analysis.series.map((p) => `${p.year}: ${p.value.toFixed(3)}`).join("   "), 180), "",
      `Source: ${run.provenance?.source_url ?? ""}`, `Retrieved: ${run.provenance?.retrieved ?? ""}`,
    ];
    let y = 15;
    for (const l of lines) { if (y > 285) { pdf.addPage(); y = 15; } pdf.setFontSize(l === lines[0] ? 15 : 10); pdf.text(String(l), 12, y); y += l === lines[0] ? 9 : 5.5; }
    const blob = pdf.output("blob");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `terra-earth-trend-${run.variable}-${run.season}.pdf`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }

  const suggested = suggestVariables(curiosity, env);
  const JUDGE_STEPS = bn
    ? ["প্রশ্ন: পুরো স্পেনে জুলাই কি আরও গরম হচ্ছে?", "অঞ্চল: স্পেনের সীমানার ভিতরের NASA গ্রিড ঘর", "চলক ও সময়: জুলাই সর্বোচ্চ তাপমাত্রা, ১৯৮১–২০২৪", "NASA থেকে সময়সারি তৈরি", "পরীক্ষা: Mann-Kendall, Theil-Sen, t-পরীক্ষা"]
    : ["Question: is July getting hotter across Spain?", "Region: NASA grid cells inside Spain's boundary", "Variable & years: July daily maximum temperature, 1981–2024", "Build the time series from NASA POWER", "Test it: Mann-Kendall, Theil-Sen and a t-test"];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-xs uppercase tracking-widest text-primary">{bn ? "NASA স্পেস অ্যাপস ২০২৬" : "NASA Space Apps 2026"}</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl">{bn ? "ট্রেন্ড ডিটেকটিভ" : "Trend Detective"}</h1>
      <p className="mt-3 max-w-3xl text-muted-foreground">{bn ? "কী বদলাচ্ছে, কোথায়, কতটা, আর তা কি পরিসংখ্যানগতভাবে উল্লেখযোগ্য? একটি স্থান, NASA চলক, মৌসুম ও বছর বেছে নিন।" : "What is changing, where, how much — and is it significant? Choose a place, a NASA variable, a season and a range of years, then test it."}</p>

      <section className="mt-8 rounded-lg border border-primary bg-primary/10 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary"><Gavel className="mr-1 inline size-3" />{bn ? "বিচারকদের জন্য ডেমো" : "Judge walkthrough"}</p>
            <h2 className="mt-1 font-display text-xl font-semibold text-foreground">{bn ? JUDGE_DEMO.bn : JUDGE_DEMO.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{JUDGE_DEMO.story}</p>
          </div>
          <Button onClick={playJudge} disabled={busy}>{busy && judgeStep === 4 ? <LoaderCircle className="animate-spin" /> : <Play />}{bn ? "ধাপে ধাপে চালান" : "Run step by step"}</Button>
        </div>
        <ol className="mt-4 grid gap-2 sm:grid-cols-5">
          {JUDGE_STEPS.map((s, i) => (
            <li key={s} className={`rounded-md border p-3 text-xs ${judgeStep > i ? "border-primary bg-card text-foreground" : "border-border text-muted-foreground"}`}>
              <span className="block font-semibold">{i + 1}{judgeStep > i + 1 || judgeStep === 5 ? " ✓" : ""}</span>{s}
            </li>
          ))}
        </ol>
        {judgeStep === 5 && sentence ? <p className="mt-4 rounded-md bg-card p-3 text-sm text-foreground"><strong>{bn ? "ফলাফল (NASA ডেটা থেকে হিসাব করা): " : "Finding (computed live from NASA data): "}</strong>{sentence}</p> : null}
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground"><Play className="mr-2 inline size-4" />{bn ? "ডেমো উদাহরণ দেখুন" : "Watch a demo investigation"}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {DEMOS.map((d) => (
            <button key={d.id} type="button" onClick={() => playDemo(d)} className="rounded-lg border border-border bg-card p-4 text-left transition hover:border-primary">
              <strong className="block text-sm text-foreground">{bn ? d.bn : d.title}</strong>
              <span className="mt-1 block text-xs text-muted-foreground">{d.story}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-lg border border-border bg-card p-5">
        <h2 className="font-display text-lg font-semibold text-foreground"><Search className="mr-2 inline size-4" />{bn ? "১. কোথায় তদন্ত করবেন?" : "1. Where do you want to investigate?"}</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <LocationSearch onSelect={(id) => { const d = getDistrict(id); if (d) setPlace({ name: d.name, lat: d.lat, lon: d.lon }); }} />
          <div className="text-sm">
            <p className="text-xs text-muted-foreground">{bn ? "নির্বাচিত" : "Selected"}</p>
            <p className="font-semibold text-foreground">{place.name} <span className="font-normal text-muted-foreground">({place.lat.toFixed(2)}°, {place.lon.toFixed(2)}°)</span></p>
            <div className="mt-2 flex gap-2">
              {(["point", "area", "region"] as const).map((s) => (
                <Button key={s} size="sm" variant={scope === s ? "default" : "outline"} onClick={() => setScope(s)}>{s === "point" ? (bn ? "একক বিন্দু" : "Single point") : s === "area" ? (bn ? "এলাকা গড় (±১°)" : "Area mean (±1°)") : (bn ? "রাজ্য / দেশ গড়" : "State / country")}</Button>
              ))}
            </div>
            {scope === "region" ? (
              <label className="mt-2 block text-xs text-muted-foreground">{bn ? "রাজ্য বা দেশের নাম" : "State or country name"}
                <input className={selectCls} value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Spain, Wisconsin, Kenya…" />
              </label>
            ) : null}
            <p className="mt-2 text-xs text-muted-foreground">{scope === "region" ? (bn ? "সীমানার ভিতরে সমান দূরত্বের ২৪টি পর্যন্ত NASA গ্রিড ঘরের গড়।" : "Averages up to 24 evenly spaced NASA POWER cells inside the official boundary (OpenStreetMap).") : (bn ? "এলাকা গড় = ৯টি NASA POWER গ্রিড ঘরের গড়; এটি দেশের গড় নয়।" : "Area mean averages 9 NASA POWER grid cells (~220 km box). It is not a national average.")}</p>
          </div>
        </div>

        <h2 className="mt-6 font-display text-lg font-semibold text-foreground"><Sparkles className="mr-2 inline size-4" />{bn ? "২. ডিটেকটিভ প্রশ্ন" : "2. Detective questions"}</h2>
        <p className="mt-3 text-sm text-foreground">{bn ? "ক) আপনি কী নিয়ে কৌতূহলী?" : "a) What are you curious about?"}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(Object.keys(CURIOSITIES) as Curiosity[]).map((c) => (
            <Button key={c} size="sm" variant={curiosity === c ? "default" : "outline"} onClick={() => { setCuriosity(c); setVariable(suggestVariables(c, env)[0]!); }}>{bn ? CURIOSITIES[c].bn : CURIOSITIES[c].label}</Button>
          ))}
        </div>
        <p className="mt-4 text-sm text-foreground">{bn ? "খ) জায়গাটি কেমন?" : "b) What kind of place is it?"}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(Object.keys(ENVIRONMENTS) as Environment[]).map((e) => (
            <Button key={e} size="sm" variant={env === e ? "default" : "outline"} onClick={() => { setEnv(e); setVariable(suggestVariables(curiosity, e)[0]!); }}>{bn ? ENVIRONMENTS[e].bn : ENVIRONMENTS[e].label}</Button>
          ))}
        </div>
        <p className="mt-4 text-sm text-foreground">{bn ? "গ) বছরের কোন সময়?" : "c) Which time of year?"}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {["annual", "DJF", "MAM", "JJA", "SON", "M7"].map((k) => <Button key={k} size="sm" variant={season === k ? "default" : "outline"} onClick={() => setSeason(k)}>{bn ? SEASONS[k]!.bn : SEASONS[k]!.label}</Button>)}
        </div>
        {suggested.length ? (
          <div className="mt-4 rounded-md border border-border bg-background p-3">
            <p className="text-xs uppercase tracking-widest text-primary">{bn ? "সূত্র: যে চলকগুলো পরীক্ষা করুন" : "Clues: variables worth testing"}</p>
            {env ? <p className="mt-1 text-xs text-muted-foreground">{ENVIRONMENTS[env].why}</p> : null}
            <div className="mt-2 flex flex-wrap gap-2">
              {suggested.map((k) => <Button key={k} size="sm" variant={variable === k ? "default" : "outline"} onClick={() => setVariable(k)}>{bn ? DETECTIVE_VARIABLES[k].bn : DETECTIVE_VARIABLES[k].label}</Button>)}
            </div>
          </div>
        ) : null}

        <h2 className="mt-6 font-display text-lg font-semibold text-foreground">{bn ? "৩. চলক, মৌসুম ও সময়" : "3. Variable, season and years"}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs text-muted-foreground">{bn ? "চলক" : "Variable"}
            <select className={selectCls} value={variable} onChange={(e) => setVariable(e.target.value as DetectiveVariable)}>
              {DETECTIVE_VARIABLE_KEYS.map((k) => <option key={k} value={k}>{suggested.includes(k) ? "★ " : ""}{bn ? DETECTIVE_VARIABLES[k].bn : DETECTIVE_VARIABLES[k].label}</option>)}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">{bn ? "মৌসুম / মাস" : "Season / month"}
            <select className={selectCls} value={season} onChange={(e) => setSeason(e.target.value)}>
              {Object.entries(SEASONS).map(([k, s]) => <option key={k} value={k}>{bn ? s.bn : s.label}</option>)}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">{bn ? "শুরু" : "From"}
            <select className={selectCls} value={start} onChange={(e) => setStart(Math.min(Number(e.target.value), end - 4))}>{years.map((y) => <option key={y}>{y}</option>)}</select>
          </label>
          <label className="text-xs text-muted-foreground">{bn ? "শেষ" : "To"}
            <select className={selectCls} value={end} onChange={(e) => setEnd(Math.max(Number(e.target.value), start + 4))}>{years.map((y) => <option key={y}>{y}</option>)}</select>
          </label>
        </div>
        <p className="mt-2 text-sm text-muted-foreground"><strong className="text-foreground">{bn ? DETECTIVE_VARIABLES[variable].bn : DETECTIVE_VARIABLES[variable].label}:</strong> {bn ? DETECTIVE_VARIABLES[variable].bnDef : DETECTIVE_VARIABLES[variable].definition} <span className="text-xs">({DETECTIVE_VARIABLES[variable].source})</span></p>
        <Button className="mt-4" onClick={() => investigate()} disabled={busy || (scope === "region" && region.trim().length < 2)}>{busy ? <LoaderCircle className="animate-spin" /> : <Search />}{bn ? "৪–৫. সময়সারি তৈরি ও পরীক্ষা করুন" : "4–5. Build time series & test trend"}</Button>
      </section>

      {busy ? <p className="mt-6 text-sm text-muted-foreground" role="status">{bn ? "NASA থেকে মাসিক রেকর্ড আনা হচ্ছে…" : "Fetching monthly NASA records…"}</p> : null}
      {run?.error ? <p className="mt-6 rounded-md border border-border bg-card p-4 text-sm text-accent">{run.error}</p> : null}
      {run && !run.error && analysis && !analysis.mk ? <p className="mt-6 rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">{bn ? "এই নির্বাচনের জন্য অন্তত ৫টি পূর্ণ বছর নেই। কোনো মান অনুমান করা হয়নি।" : "Fewer than 5 complete years for this selection. No values were estimated."}</p> : null}

      {run && meta && analysis?.mk ? (
        <section className="mt-8 space-y-6">
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="font-display text-xl font-semibold text-foreground">{meta.label} · {SEASONS[run.season]!.label} · {run.place.name}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{scopeLabel} · {meta.source}</p>
            <div className="mt-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={analysis.chart} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                  <XAxis dataKey="year" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} domain={["auto", "auto"]} unit={meta.unit.length < 4 ? ` ${meta.unit}` : ""} />
                  <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }} />
                  <Legend />
                  <Line type="monotone" dataKey="value" name={`Observed (${meta.unit})`} stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 2 }} />
                  <Line type="linear" dataKey="ols" name="Linear regression" stroke="var(--color-accent)" strokeDasharray="6 4" dot={false} />
                  <Line type="linear" dataKey="sen" name="Theil-Sen" stroke="var(--color-muted-foreground)" strokeDasharray="2 3" dot={false} />
                  <Scatter dataKey="value" fill="var(--color-primary)" legendType="none" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`rounded-lg border p-5 ${analysis.mk.trend.significant_at_0_05 ? "border-primary bg-primary/10" : "border-border bg-card"}`}>
            <p className="text-xs uppercase tracking-widest text-primary">{analysis.mk.trend.significant_at_0_05 ? (bn ? "উল্লেখযোগ্য প্রবণতা" : "Significant trend") : (bn ? "উল্লেখযোগ্য নয়" : "Not significant")}</p>
            <p className="mt-2 text-foreground">{sentence}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Stat title={bn ? "দিক (Mann-Kendall)" : "Direction (Mann-Kendall)"} value={analysis.mk.trend.direction} rows={[["Kendall τ", analysis.mk.trend.tau.toFixed(3)], ["Z", analysis.mk.trend.z.toFixed(3)], ["p-value", analysis.mk.trend.p_value.toFixed(4)]]} />
            <Stat title={bn ? "পরিবর্তনের হার (Theil-Sen)" : "Rate of change (Theil-Sen)"} value={`${analysis.mk.slope.slope_per_decade.toFixed(3)} ${meta.unit}/decade`} rows={[["95% CI low", (analysis.mk.slope.ci_low * 10).toFixed(3)], ["95% CI high", (analysis.mk.slope.ci_high * 10).toFixed(3)], ["Years", `${analysis.mk.period.start}–${analysis.mk.period.end} (n=${analysis.mk.n_observations})`]]} />
            {analysis.ols ? <Stat title={bn ? "রৈখিক রিগ্রেশন ও t-পরীক্ষা" : "Linear regression & t-test"} value={`${analysis.ols.slope_per_decade.toFixed(3)} ${meta.unit}/decade`} rows={[["t (df)", `${analysis.ols.t_statistic.toFixed(3)} (${analysis.ols.degrees_of_freedom})`], ["p-value", analysis.ols.p_value.toFixed(4)], ["95% CI", `${analysis.ols.ci95_low_per_decade.toFixed(3)} to ${analysis.ols.ci95_high_per_decade.toFixed(3)}`], ["R²", analysis.ols.r_squared.toFixed(3)]]} /> : null}
          </div>
          <p className="text-xs text-muted-foreground">{bn ? "p < 0.05 হলে প্রবণতাটি উল্লেখযোগ্য। উল্লেখযোগ্য না হলেও প্রবণতা গুরুত্বপূর্ণ হতে পারে — দীর্ঘ রেকর্ড প্রয়োজন হতে পারে। শুধু রৈখিক প্রবণতা পরীক্ষা করা হয়।" : "A trend is called significant when p < 0.05. A non-significant trend can still matter — sometimes it only needs a longer record. Only linear trends are tested; choosing a single season removes the seasonal cycle."}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportCsv}><Download />CSV</Button>
            <Button variant="outline" onClick={exportPdf} aria-label="Download PDF report"><FileText />PDF {bn ? "রিপোর্ট" : "report"}</Button>
            {run.provenance ? <a className="self-center text-xs text-primary hover:underline" href={run.provenance.source_url} target="_blank" rel="noreferrer">{bn ? "NASA উৎস" : "NASA source"} ↗</a> : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Stat({ title, value, rows }: { title: string; value: string; rows: [string, string][] }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="mt-1 font-display text-lg font-semibold text-foreground first-letter:uppercase">{value}</p>
      <dl className="mt-3 space-y-1 text-xs">{rows.map(([k, v]) => <div key={k} className="flex justify-between gap-2"><dt className="text-muted-foreground">{k}</dt><dd className="text-foreground">{v}</dd></div>)}</dl>
    </div>
  );
}
