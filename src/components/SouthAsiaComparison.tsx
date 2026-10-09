import { useMemo, useState } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProvenanceButton } from "@/components/ProvenanceDrawer";
import { VARIABLE_KEYS, VARIABLE_LABEL_KEY, type VariableKey } from "@/lib/climate";
import { fmt, useLang } from "@/lib/i18n";
import {
  getRegionalAnalysis,
  getRegionalSeries,
  similarityToBangladesh,
  southAsiaLocations,
} from "@/lib/south-asia";

export interface RegionalSelection {
  active: boolean;
  variable: VariableKey;
  selectedId: string;
  onSelect: (id: string) => void;
  onVariable: (variable: VariableKey) => void;
  onActive: (active: boolean) => void;
}

export function SouthAsiaComparison({ selection }: { selection: RegionalSelection }) {
  const { lang, t } = useLang();
  const [expanded, setExpanded] = useState(false);
  const location = southAsiaLocations.find((item) => item.id === selection.selectedId) ?? southAsiaLocations[0];
  const variable = location?.variables[selection.variable];
  const analysis = getRegionalAnalysis(location?.id ?? "", selection.variable);
  const similarity = similarityToBangladesh(location?.id ?? "", selection.variable);
  const series = useMemo(
    () => getRegionalSeries(location?.id ?? "", selection.variable),
    [location?.id, selection.variable],
  );

  return (
    <section className="border-y border-border bg-elevated/55">
      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase text-accent">
              {lang === "bn" ? "দক্ষিণ এশিয়া · NASA নমুনা" : "South Asia · NASA samples"}
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl">
              {lang === "bn" ? "বাংলাদেশের সঙ্গে কোন এলাকার ধরণ মেলে?" : "Which places move like Bangladesh?"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {lang === "bn"
                ? "রাজধানীর কাছের প্রতিনিধিত্বমূলক বিন্দু; এগুলো দেশের গড় নয়। মিল বার্ষিক ওঠানামার correlation, কারণের প্রমাণ নয়।"
                : "Representative points near capitals, not national averages. Similarity is correlation between annual changes, not evidence of causation."}
            </p>
          </div>
          <Button
            type="button"
            variant={selection.active ? "default" : "outline"}
            aria-pressed={selection.active}
            onClick={() => selection.onActive(!selection.active)}
          >
            <MapPin className="size-4" aria-hidden="true" />
            {selection.active
              ? lang === "bn" ? "তুলনা চালু" : "Comparison on"
              : lang === "bn" ? "গ্লোবে দেখান" : "Show on globe"}
          </Button>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-2" aria-label={lang === "bn" ? "চলক বাছাই" : "Choose variable"}>
          {VARIABLE_KEYS.map((key) => (
            <Button
              key={key}
              type="button"
              size="sm"
              variant={selection.variable === key ? "default" : "outline"}
              aria-pressed={selection.variable === key}
              onClick={() => selection.onVariable(key)}
              className="shrink-0"
            >
              {t(VARIABLE_LABEL_KEY[key])}
            </Button>
          ))}
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-9" aria-label={lang === "bn" ? "অবস্থান বাছাই" : "Choose location"}>
          {southAsiaLocations.map((item) => (
            <Button
              key={item.id}
              type="button"
              size="sm"
              variant={location?.id === item.id ? "default" : "outline"}
              aria-pressed={location?.id === item.id}
              onClick={() => selection.onSelect(item.id)}
              className="min-w-0 justify-start overflow-hidden px-2"
            >
              <span className="truncate">{lang === "bn" ? item.bn : item.name}</span>
            </Button>
          ))}
        </div>

        <div className="glass-panel mt-4 grid gap-4 border border-border p-4 md:grid-cols-[1.2fr_repeat(3,1fr)_auto] md:items-center">
          <div>
            <p className="font-display text-xl font-semibold text-foreground">{location ? (lang === "bn" ? location.bn : location.name) : "—"}</p>
            <p className="text-xs text-muted-foreground">{t(VARIABLE_LABEL_KEY[selection.variable])} · 2015–2024</p>
          </div>
          <Metric label={lang === "bn" ? "পর্যবেক্ষণ" : "Observations"} value={String(analysis?.n_observations ?? 0)} />
          <Metric
            label={lang === "bn" ? "প্রবণতা" : "Trend"}
            value={analysis ? `${analysis.trend.direction} · ${fmt(analysis.slope.slope_per_decade, lang, 3)} ${variable?.unit ?? ""}/decade` : lang === "bn" ? "উপাত্ত নেই" : "Unavailable"}
          />
          <Metric
            label={lang === "bn" ? "বাংলাদেশের সঙ্গে মিল" : "Similarity to Bangladesh"}
            value={similarity === null ? (lang === "bn" ? "উপাত্ত নেই" : "Unavailable") : `${fmt(similarity * 100, lang, 0)}%`}
          />
          {variable ? <ProvenanceButton provenance={variable.provenance} payload={{ location, series, analysis, similarity }} title={`${location?.name} · ${variable.label}`} /> : null}
        </div>
        <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => setExpanded((value) => !value)}>
          <ExternalLink className="size-4" aria-hidden="true" />
          {expanded ? (lang === "bn" ? "পদ্ধতি লুকান" : "Hide method") : (lang === "bn" ? "পদ্ধতি ও সতর্কতা" : "Method and caveats")}
        </Button>
        {expanded ? (
          <p className="max-w-4xl text-xs leading-6 text-muted-foreground">
            {lang === "bn"
              ? "প্রবণতা Mann–Kendall পরীক্ষায় এবং হার Theil–Sen estimator-এ নির্ণীত। কমপক্ষে ৫টি overlapping বছর না থাকলে কোনো ফল দেখানো হয় না। Maldives LST-এর মতো অনুপস্থিত MODIS record অনুমান করে পূরণ করা হয়নি।"
              : "Trend direction uses Mann–Kendall and rate uses the Theil–Sen estimator. No result is shown below five overlapping years. Missing MODIS records, such as Maldives LST, are never estimated or filled."}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l border-border pl-3">
      <p className="text-[11px] uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}