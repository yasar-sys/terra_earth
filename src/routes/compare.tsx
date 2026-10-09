import { LocationSearch } from "@/components/LocationSearch";
import { useLocationEvidence } from "@/lib/location-evidence";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Download, FileCheck2, LoaderCircle } from "lucide-react";
import { Area, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ProvenanceButton } from "@/components/ProvenanceDrawer";
import {
  analyzeVariable,
  availableVariables,
  districts,
  getDistrict,
  VARIABLE_KEYS,
  VARIABLE_LABEL_KEY,
  yearBounds,
  type VariableAnalysis,
  type VariableKey,
} from "@/lib/climate";
import { senLine } from "@/lib/stats";
import { fmt, useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { StudentInsight } from "@/components/StudentInsight";
import { exportComparisonPdf } from "@/lib/export-comparison";

export const Route = createFileRoute("/compare")({
  validateSearch: (search: Record<string, unknown>) => ({
    districtA: typeof search["districtA"] === "string" ? (search["districtA"] as string) : undefined,
    districtB: typeof search["districtB"] === "string" ? (search["districtB"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Compare worldwide trends — Terra Earth" },
      {
        name: "description",
        content:
          "Compare two locations worldwide, or two variables at one location, over any year range with Theil-Sen trend lines.",
      },
      { property: "og:title", content: "Compare worldwide trends" },
      {
        property: "og:description",
        content: "Pick a year range and compare trends with per-line significance reported honestly.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ComparePage,
});

const COLORS: [string, string] = ["#F2A93B", "#7C6FF0"];

interface CompareLine {
  key: string;
  label: string;
  analysis: VariableAnalysis | null;
  districtName: string;
}

function ComparePage() {
  const search = Route.useSearch();
  const { t, lang } = useLang();
  const L = (en: string, bn: string) => (lang === "bn" ? bn : en);
  const bounds = {min: 2001, max: 2024};
  const [mode, setMode] = useState<"districts" | "variables">("districts");
  const [a, setA] = useState(search.districtA ?? "dhaka");
  const [b, setB] = useState(search.districtB ?? "india");

  const [v1, setV1] = useState<VariableKey>("temperature");
  const [v2, setV2] = useState<VariableKey>("precipitation");
  const needsModis = [v1, ...(mode === "variables" ? [v2] : [])].some(v=>v === "ndvi" || v === "lst");
  const evidenceA = useLocationEvidence(a, needsModis);
  const evidenceB = useLocationEvidence(b, needsModis);
  const [start, setStart] = useState(bounds.min);
  const [end, setEnd] = useState(bounds.max);
  const [exporting, setExporting] = useState(false);
  const [aiInterpretation, setAiInterpretation] = useState("");
  const reportRef = useRef<HTMLDivElement>(null);
  const range = { start: Math.min(start, end), end: Math.max(start, end) };
  const dName = (id: string) => {
    const d = getDistrict(id);
    return d ? (lang === "bn" ? d.bn : d.name) : id;
  };

  const lines: CompareLine[] = useMemo(() => {
    const specs =
      mode === "districts"
        ? [
            { d: a, v: v1 },
            { d: b, v: v1 },
          ]
        : [
            { d: a, v: v1 },
            { d: a, v: v2 },
          ];
    return specs.map((s, i) => ({
      key: `l${i}`,
      districtName: dName(s.d),
      label: mode === "districts" ? dName(s.d) : t(VARIABLE_LABEL_KEY[s.v]),
      analysis: s.d.startsWith("g_") && !evidenceA.hydrated ? null : analyzeVariable(s.d, s.v, range),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, a, b, v1, v2, range.start, range.end, lang, evidenceA.version, evidenceB.version, evidenceA.hydrated]);

  const chartData = useMemo(() => {
    const years: number[] = [];
    for (let y = range.start; y <= range.end; y++) years.push(y);
    return years.map((year) => {
      const row: Record<string, number | [number, number] | undefined> = { year };
      lines.forEach((l) => {
        if (!l.analysis) return;
        const p = l.analysis.series.find((s) => s.year === year);
        if (p) row[l.key] = p.value;
        const fit = senLine(l.analysis.result.slope, [year])[0]!;
        // CI band pivots around the median point so it widens away from the data centre
        const my = (l.analysis.result.period.start + l.analysis.result.period.end) / 2;
        const mv = l.analysis.result.slope.intercept + l.analysis.result.slope.slope_per_year * my;
        const lo = mv + l.analysis.result.slope.ci_low * (year - my);
        const hi = mv + l.analysis.result.slope.ci_high * (year - my);
        row[`${l.key}fit`] = fit.fit;
        row[`${l.key}band`] = [Math.min(lo, hi), Math.max(lo, hi)];
      });
      return row;
    });
  }, [lines, range.start, range.end]);

  const dualAxis = mode === "variables";
  const sig = lines.map((l) => l.analysis?.result.trend.significant_at_0_05 ?? null);

  let verdict = "";
  if (lines.some((l) => !l.analysis)) {
    verdict = L(
      "At least one line has no cached data (or fewer than 5 years) in this window, so no comparison is made.",
      "এই সময়সীমায় অন্তত একটি রেখার সংরক্ষিত তথ্য নেই (বা ৫ বছরের কম), তাই তুলনা করা হয়নি।",
    );
  } else if (sig[0] && sig[1]) {
    verdict = L("Both lines show a statistically significant trend (p < 0.05).", "দুটি রেখাই পরিসংখ্যানগতভাবে উল্লেখযোগ্য প্রবণতা দেখায় (p < ০.০৫)।");
  } else if (sig[0] !== sig[1]) {
    const yes = sig[0] ? lines[0]! : lines[1]!;
    const no = sig[0] ? lines[1]! : lines[0]!;
    verdict = L(
      `${yes.label} has a significant trend, but ${no.label} does not — its change could be random year-to-year variation. Do not read them as equally strong.`,
      `${yes.label}-এর প্রবণতা উল্লেখযোগ্য, কিন্তু ${no.label}-এর নয় — এর পরিবর্তন বছরে-বছরে এলোমেলো ওঠানামা হতে পারে। দুটিকে সমান শক্তিশালী ধরবেন না।`,
    );
  } else {
    verdict = L(
      "Neither line shows a statistically significant trend in this window. Differences in slope may be noise.",
      "এই সময়সীমায় কোনো রেখাই উল্লেখযোগ্য প্রবণতা দেখায় না। ঢালের পার্থক্য কেবল এলোমেলো হতে পারে।",
    );
  }

  const years: number[] = [];
  for (let y = bounds.min; y <= bounds.max; y++) years.push(y);
  const sel = "rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground";
  const varOptions = (id: string) => {
    const av = availableVariables(id);
    return VARIABLE_KEYS.map((k) => (
      <option key={k} value={k}>
        {t(VARIABLE_LABEL_KEY[k])}
        {av.includes(k) ? "" : ` (${L("no data", "তথ্য নেই")})`}
      </option>
    ));
  };

  async function downloadReport() {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      await exportComparisonPdf(reportRef.current, `Terra Earth-comparison-${a}-${mode === "districts" ? b : v2}.pdf`);
    } finally {
      setExporting(false);
    }
  }
  const districtSelect = (value: string, set: (v: string) => void, label: string) => (
    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
      {label}
      <LocationSearch label={label + " — country or city"} onSelect={set} />
      <select className={sel} value={value} onChange={(e) => set(e.target.value)}>
        {[...districts, ...(!districts.some(d=>d.id === value) && getDistrict(value) ? [getDistrict(value)].filter((d): d is NonNullable<typeof d> => !!d) : [])].map((d) => (
          <option key={d.id} value={d.id}>
            {lang === "bn" ? d.bn : d.name}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="mx-auto max-w-7xl px-3 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-accent">{L("Evidence lab", "প্রমাণ গবেষণাগার")}</p>
          <h1 className="mt-2 font-display text-3xl text-foreground sm:text-4xl">{t("compare.title")}</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            {L(
              "Each line gets its own Mann-Kendall test and Theil-Sen trend with a 95% confidence band, computed only for the years you pick.",
              "প্রতিটি রেখার নিজস্ব ম্যান-কেন্ডাল পরীক্ষা ও ৯৫% আস্থা ব্যান্ডসহ থাইল-সেন প্রবণতা, কেবল নির্বাচিত বছরগুলোর জন্য।",
            )}
          </p>
        </div>
        <Button onClick={downloadReport} disabled={exporting} variant="outline">
          {exporting ? <LoaderCircle className="animate-spin" aria-hidden /> : <Download aria-hidden />}
          {exporting ? t("compare.exporting") : t("compare.export")}
        </Button>
      </div>

      {evidenceA.isFetching || evidenceB.isFetching ? <p role="status" className="mt-4 text-accent">Loading NASA observations…</p> : null}
      {[...(evidenceA.data?.warnings ?? []), ...(evidenceB.data?.warnings ?? [])].map((w,i)=><p key={i} className="mt-2 text-xs text-accent">{w}</p>)}
      <div className="panel mt-5 flex flex-wrap items-end gap-3 p-4">
        <div role="radiogroup" aria-label={L("Comparison mode", "তুলনার ধরন")} className="flex flex-wrap gap-2">
          {(["districts", "variables"] as const).map((m) => (
            <button
              key={m}
              role="radio"
              aria-checked={mode === m}
              onClick={() => setMode(m)}
              className={`rounded-full border px-3 py-1.5 text-sm ${mode === m ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground hover:bg-secondary"}`}
            >
              {t(`compare.mode.${m}`)}
            </button>
          ))}
        </div>
        {districtSelect(a, setA, mode === "districts" ? L("Location A", "জেলা ক") : L("Location", "স্থান"))}
        {mode === "districts" && districtSelect(b, setB, L("Location B", "জেলা খ"))}
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          {mode === "districts" ? L("Variable", "সূচক") : L("Variable 1", "সূচক ১")}
          <select className={sel} value={v1} onChange={(e) => setV1(e.target.value as VariableKey)}>
            {varOptions(a)}
          </select>
        </label>
        {mode === "variables" && (
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            {L("Variable 2", "সূচক ২")}
            <select className={sel} value={v2} onChange={(e) => setV2(e.target.value as VariableKey)}>
              {varOptions(a)}
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          {t("compare.start")}
          <select className={sel} value={start} onChange={(e) => setStart(Number(e.target.value))}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          {t("compare.end")}
          <select className={sel} value={end} onChange={(e) => setEnd(Number(e.target.value))}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
      </div>

      <div ref={reportRef} className="comparison-report mt-5 p-3 sm:p-5">
        <div className="report-only mb-5 border-b border-border pb-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase text-accent"><FileCheck2 aria-hidden /> {t("compare.report")}</p>
          <h2 className="mt-2 font-display text-2xl text-foreground">Terra Earth</h2>
          <p className="mt-1 text-sm text-muted-foreground">{lines.map((line) => line.label).join(" · ")} · {range.start}–{range.end}</p>
        </div>
      <div className="h-[360px] sm:h-[440px]" role="img" aria-label={verdict}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: dualAxis ? 10 : 20, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
            <XAxis dataKey="year" stroke="var(--chart-axis)" fontSize={11} />
            <YAxis yAxisId="l0" stroke={COLORS[0]} fontSize={11} domain={["auto", "auto"]} width={44} />
            <YAxis yAxisId={dualAxis ? "l1" : "l0"} orientation="right" hide={!dualAxis} stroke={COLORS[1]} fontSize={11} domain={["auto", "auto"]} width={44} />
            <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", color: "var(--popover-foreground)", borderRadius: "8px", backdropFilter: "blur(16px)" }} />
            <Legend />
            {lines.map((l, i) =>
              l.analysis ? [
                <Area key={`${l.key}b`} yAxisId={dualAxis ? l.key : "l0"} dataKey={`${l.key}band`} stroke="none" fill={COLORS[i as 0 | 1]} fillOpacity={0.12} legendType="none" name={`${l.label} 95% CI`} isAnimationActive={false} />,
                <Line key={`${l.key}f`} yAxisId={dualAxis ? l.key : "l0"} dataKey={`${l.key}fit`} stroke={COLORS[i as 0 | 1]} strokeDasharray="6 4" dot={false} legendType="none" name={`${l.label} Theil-Sen`} isAnimationActive={false} />,
                <Line key={l.key} yAxisId={dualAxis ? l.key : "l0"} dataKey={l.key} stroke={COLORS[i as 0 | 1]} strokeWidth={2} dot={{ r: 2 }} name={`${l.label} (${l.analysis.unit})`} connectNulls isAnimationActive={false} />,
              ] : null,
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-4 border-l-4 border-l-[var(--rising)] bg-card p-4 text-sm text-foreground">{verdict}</p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {lines.map((l, i) => (
          <div key={l.key} className="panel p-4">
            <h2 className="flex items-center gap-2 font-display text-lg text-foreground">
              <span className="inline-block h-3 w-3 rounded-full" style={{ background: COLORS[i as 0 | 1] }} aria-hidden />
              {l.label}
            </h2>
            {l.analysis ? (
              <>
                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                  <dt className="text-muted-foreground">{L("Rate / decade", "হার / দশক")}</dt>
                  <dd className="font-mono text-foreground">{fmt(l.analysis.result.slope.slope_per_decade, lang, 3)} {l.analysis.unit}</dd>
                  <dt className="text-muted-foreground">95% CI</dt>
                  <dd className="font-mono text-foreground">[{fmt(l.analysis.result.slope.ci_low * 10, lang, 3)}, {fmt(l.analysis.result.slope.ci_high * 10, lang, 3)}]</dd>
                  <dt className="text-muted-foreground">Mann-Kendall Z</dt>
                  <dd className="font-mono text-foreground">{fmt(l.analysis.result.trend.z, lang, 2)}</dd>
                  <dt className="text-muted-foreground">p-value</dt>
                  <dd className="font-mono text-foreground">{fmt(l.analysis.result.trend.p_value, lang, 4)}</dd>
                  <dt className="text-muted-foreground">n</dt>
                  <dd className="font-mono text-foreground">{fmt(l.analysis.result.n_observations, lang, 0)}</dd>
                </dl>
                <p className="mt-2 text-sm text-muted-foreground">
                  {l.analysis.result.trend.significant_at_0_05
                    ? L(`Significant ${l.analysis.result.trend.direction} trend (p < 0.05).`, `উল্লেখযোগ্য প্রবণতা (${l.analysis.result.trend.direction === "increasing" ? "বাড়ছে" : "কমছে"}, p < ০.০৫)।`)
                    : L("Not statistically significant — the fitted slope could be chance.", "পরিসংখ্যানগতভাবে উল্লেখযোগ্য নয় — ঢালটি কাকতালীয় হতে পারে।")}
                </p>
                <div className="mt-3">
                  <ProvenanceButton
                    provenance={l.analysis.provenance}
                    title={l.label}
                    payload={{
                      district: l.districtName,
                      variable: l.analysis.variable,
                      period: l.analysis.result.period,
                      n_observations: l.analysis.result.n_observations,
                      trend: l.analysis.result.trend,
                      slope: { ...l.analysis.result.slope, units: `${l.analysis.unit}/year` },
                      provenance: l.analysis.provenance,
                    }}
                  />
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">{t("district.nodata")}</p>
            )}
          </div>
        ))}
      </div>
      {aiInterpretation ? (
        <div className="report-only mt-4 border-t border-border pt-4">
          <h3 className="text-sm font-semibold text-foreground">{L("AI interpretation", "AI ব্যাখ্যা")}</h3>
          <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-muted-foreground">{aiInterpretation}</p>
        </div>
      ) : null}
      </div>

      <StudentInsight districtId={a} variable={v1} start={range.start} end={range.end} onResult={setAiInterpretation} />
    </div>
  );
}
