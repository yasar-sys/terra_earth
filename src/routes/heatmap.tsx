import { LocationSearch } from "@/components/LocationSearch";
import { useLocationEvidence } from "@/lib/location-evidence";
import { districts, getCached, getDistrict } from "@/lib/climate";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { GlobeStage } from "@/components/GlobeStage";
import { ProvenanceButton } from "@/components/ProvenanceDrawer";
import { nearestDistrict, type Provenance, type VariableKey } from "@/lib/climate";
import { spectralGradient } from "@/lib/colors";
import { analyzeSeries } from "@/lib/stats";
import { fmt, useLang } from "@/lib/i18n";
import { exportGridCsv, exportGridPdf, type GridExport } from "@/lib/export-grid";
import { Button } from "@/components/ui/button";
import tempGrid from "@/data/grid/temperature.json";
import precipGrid from "@/data/grid/precipitation.json";
import solarGrid from "@/data/grid/solar.json";
import ndviGrid from "@/data/grid/ndvi.json";
import lstGrid from "@/data/grid/lst.json";

export const Route = createFileRoute("/heatmap")({
  head: () => ({
    meta: [
      { title: "Worldwide NASA sample map — Terra Earth" },
      {
        name: "description",
        content:
          "Worldwide NASA coordinate samples and preserved Bangladesh grids, with temperature, rainfall, sunlight, vegetation and land-temperature evidence.",
      },
      { property: "og:title", content: "Worldwide NASA sample map" },
      {
        property: "og:description",
        content: "Switch between temperature, rainfall and sunlight grids computed from cached NASA data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HeatmapPage,
});

interface Grid {
  variable: string;
  unit: string;
  cells: { lat: number; lng: number; annual: Record<string, number>; place?:string; provenance?:Provenance }[];
  provenance: Provenance;
}

const GRIDS: Record<"temperature" | "precipitation" | "solar" | "ndvi" | "lst", Grid> = {
  ndvi: ndviGrid as Grid,
  lst: lstGrid as Grid,
  temperature: tempGrid as Grid,
  precipitation: precipGrid as Grid,
  solar: solarGrid as Grid,
};

const LABELS = {
  temperature: { en: "Air temperature", bn: "বায়ুর তাপমাত্রা" },
  precipitation: { en: "Rainfall", bn: "বৃষ্টিপাত" },
  solar: { en: "Solar radiation", bn: "সৌর বিকিরণ" },
  ndvi: { en: "Vegetation (NDVI)", bn: "উদ্ভিদ সূচক (NDVI)" },
  lst: { en: "Land surface temp.", bn: "ভূপৃষ্ঠের তাপমাত্রা" },
};

function HeatmapPage() {
  const { lang } = useLang();
  const L = (en: string, bn: string) => (lang === "bn" ? bn : en);
  const [variable, setVariable] = useState<keyof typeof GRIDS>("temperature");
  const [mode, setMode] = useState<"year" | "trend">("year");
  const [scope,setScope] = useState<"world"|"bangladesh">("world");
  const [selected,setSelected] = useState("india");
  const evidence = useLocationEvidence(selected, variable === "ndvi" || variable === "lst");
  const globalGrid = useMemo(() => {
    const records = [...districts, ...(!districts.some(d=>d.id === selected) && getDistrict(selected) ? [getDistrict(selected)].filter((d): d is NonNullable<typeof d> => !!d) : [])].flatMap(d => { const v = d.id.startsWith("g_") && !evidence.hydrated ? undefined : getCached(d.id)?.variables[variable]; return v ? [{location:d,variable:v}] : []; });
    const first = records[0]?.variable;
    return {variable,unit:first?.unit ?? "",cells:records.map(r => ({lat:r.location.lat,lng:r.location.lon,annual:r.variable.annual,place:r.location.name,provenance:r.variable.provenance})),provenance:{dataset_id:"NASA_GLOBAL_POINT_COLLECTION",source_url:"https://power.larc.nasa.gov/",retrieved:first?.provenance.retrieved ?? "",mode:"cache" as const}};
  },[variable,evidence.version,selected,evidence.hydrated]);
  const grid = scope === "world" ? globalGrid : GRIDS[variable];
  const isSat = variable === "ndvi" || variable === "lst";
  const years = useMemo(
    () => [...new Set(grid.cells.flatMap((c) => Object.keys(c.annual)))].map(Number).sort((a, b) => a - b),
    [grid],
  );
  const [year, setYear] = useState(2024);
  const activeYear = years.includes(year) ? year : years[years.length - 1] ?? 2024;

  const points = useMemo(() => {
    if (mode === "year") {
      return grid.cells
        .filter((c) => c.annual[String(activeYear)] !== undefined)
        .map((c) => ({ lat: c.lat, lng: c.lng, value: c.annual[String(activeYear)]! }));
    }
    return grid.cells.flatMap((c) => {
      const r = analyzeSeries(
        Object.entries(c.annual).map(([y, v]) => ({ year: Number(y), value: v })),
      );
      return r ? [{ lat: c.lat, lng: c.lng, value: r.slope.slope_per_decade, sig: r.trend.significant_at_0_05 }] : [];
    });
  }, [grid, mode, activeYear]);

  const placeName = (lat: number, lng: number) => {
    const sample = grid.cells.find(c=>c.lat===lat && c.lng===lng);
    if (scope === "world") return sample?.place ?? `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
    const d = nearestDistrict(lat, lng);
    return d ? (lang === "bn" ? d.bn : d.name) : "—";
  };
  const sorted = [...points].sort((a, b) => b.value - a.value);
  const unit = mode === "trend" ? `${grid.unit} / ${L("decade", "দশক")}` : grid.unit;
  const sigCount = mode === "trend" ? points.filter((p) => (p as { sig?: boolean }).sig).length : 0;

  const buildExport = (): GridExport => ({
    variable,
    variableLabel: LABELS[variable].en,
    unit: grid.unit,
    datasetId: grid.provenance.dataset_id,
    sourceUrl: grid.provenance.source_url,
    retrieved: grid.provenance.retrieved,
    cells: grid.cells.map((c) => {
      const r = analyzeSeries(Object.entries(c.annual).map(([y, v]) => ({ year: Number(y), value: v })));
      const d = nearestDistrict(c.lat, c.lng);
      return {
        place: c.place ?? d?.name ?? "-",
        ...(c.provenance ? {provenance:c.provenance} : {}),
        lat: c.lat,
        lng: c.lng,
        annual: c.annual,
        trend: r ? { slope_per_decade: r.slope.slope_per_decade, p_value: r.trend.p_value, significant: r.trend.significant_at_0_05 } : null,
      };
    }),
  });

  return (
    <div className="mx-auto max-w-7xl px-3 py-8 sm:px-6">
      <h1 className="font-display text-3xl text-foreground sm:text-4xl">
        {L("Worldwide evidence map", "বিশ্বের প্রমাণ মানচিত্র")}
      </h1>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        {L(
          scope === "world" ? "Loaded coordinate samples worldwide. Unmeasured areas remain empty; these points do not imply continuous global coverage or national averages." : isSat
            ? `Each hexagon aggregates real NASA MODIS satellite samples (${grid.cells.length} sites, one per district). No values are interpolated — colour and height come only from cached measurements.`
            : `Each hexagon aggregates real NASA POWER grid cells (0.5° × 0.625°). ${grid.cells.length} cells cover the country. Colour and height come only from cached values.`,
          scope === "world" ? "বিশ্বব্যাপী লোড করা স্থানাঙ্কের নমুনা। ফাঁকা স্থানে তথ্য নেই; এগুলো সম্পূর্ণ বিশ্বব্যাপী গ্রিড বা দেশের গড় নয়।" : isSat
            ? `প্রতিটি ষড়ভুজ আসল নাসা MODIS উপগ্রহ নমুনা থেকে তৈরি (${grid.cells.length}টি স্থান, প্রতি জেলায় একটি)। কোনো মান অনুমান করা হয়নি।`
            : `প্রতিটি ষড়ভুজ আসল নাসা POWER গ্রিড কোষ (০.৫° × ০.৬২৫°) থেকে তৈরি। ${grid.cells.length}টি কোষ দেশকে ঢেকে রাখে। রং ও উচ্চতা কেবল সংরক্ষিত মান থেকে।`,
        )}
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2"><LocationSearch onSelect={id=>{setSelected(id);setScope("world");}} /><div className="flex items-end gap-2"><Button variant={scope === "world" ? "default" : "outline"} onClick={()=>setScope("world")}>{L("Worldwide samples","বিশ্বব্যাপী নমুনা")}</Button><Button variant={scope === "bangladesh" ? "default" : "outline"} onClick={()=>setScope("bangladesh")}>{L("Bangladesh grid","বাংলাদেশ গ্রিড")}</Button></div></div>
      {evidence.isFetching ? <p role="status" className="mt-3 text-accent">Loading NASA map sample…</p> : null}
      {evidence.data?.warnings.map(w=><p key={w} className="mt-2 text-xs text-accent">{w}</p>)}
      <div className="mt-5 flex flex-wrap items-end gap-3">
        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">{L("Variable", "সূচক")}</legend>
          {(Object.keys(GRIDS) as (keyof typeof GRIDS)[]).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={variable === k}
              onClick={() => setVariable(k)}
              className={`rounded-full border px-3 py-1.5 text-sm ${variable === k ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground hover:bg-secondary"}`}
            >
              {L(LABELS[k].en, LABELS[k].bn)}
            </button>
          ))}
        </fieldset>
        <label className="text-sm text-muted-foreground">
          {L("View", "দেখুন")}{" "}
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as "year" | "trend")}
            className="ml-1 rounded-md border border-border bg-card px-2 py-1 text-foreground"
          >
            <option value="year">{L("Annual mean for a year", "একটি বছরের বার্ষিক গড়")}</option>
            <option value="trend">{L("Theil-Sen trend per decade", "প্রতি দশকে থাইল-সেন প্রবণতা")}</option>
          </select>
        </label>
        {mode === "year" && (
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            {L("Year", "বছর")} <span className="font-mono text-foreground">{fmt(activeYear, lang, 0).replace(/,/g, "")}</span>
            <input
              type="range"
              min={years[0] ?? 2024}
              max={years[years.length - 1] ?? 2024}
              value={activeYear}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-40 accent-[var(--color-primary)]"
            />
          </label>
        )}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="panel h-[420px] overflow-hidden sm:h-[560px]">
          <GlobeStage
            variable={variable as VariableKey}
            phase="world"
            onPhaseChange={() => {}}
            onSelectDistrict={(id) => {setSelected(id); setScope("world");}}
            hexMode
            gridPoints={points}
            gridUnit={unit}
            gridCaption={mode === "trend" ? L("Theil-Sen trend per decade", "প্রতি দশকে থাইল-সেন প্রবণতা") : `${L("Annual mean", "বার্ষিক গড়")} ${activeYear}`}
          />
        </div>
        <aside className="panel p-4">
          <h2 className="font-display text-lg text-foreground">
            {L(LABELS[variable].en, LABELS[variable].bn)} · <span className="text-sm text-muted-foreground">{unit}</span>
          </h2>
          <div className="mt-3">
            <div className="h-2.5 w-full rounded-full" style={{ background: spectralGradient(variable as VariableKey) }} />
            <div className="mt-1 flex justify-between font-mono text-[11px] text-muted-foreground">
              <span>{fmt(sorted[sorted.length - 1]?.value ?? 0, lang, 2)}</span>
              <span>{fmt(sorted[0]?.value ?? 0, lang, 2)}</span>
            </div>
          </div>
          {mode === "trend" && (
            <p className="mt-2 text-xs text-muted-foreground">
              {L(
                `${sigCount} of ${points.length} cells show a statistically significant Mann-Kendall trend (p < 0.05).`,
                `${points.length}টির মধ্যে ${sigCount}টি কোষে পরিসংখ্যানগতভাবে উল্লেখযোগ্য ম্যান-কেন্ডাল প্রবণতা (p < ০.০৫)।`,
              )}
            </p>
          )}
          <h3 className="mt-4 text-xs uppercase tracking-wide text-muted-foreground">{L("Highest measured samples", "সর্বোচ্চ কোষ")}</h3>
          <ol className="mt-1 space-y-1 text-sm">
            {sorted.slice(0, 5).map((p) => (
              <li key={`${p.lat},${p.lng}`} className="flex justify-between font-mono text-foreground">
                <span className="font-sans">{placeName(p.lat, p.lng)} <span className="text-[10px] text-muted-foreground font-mono">{p.lat.toFixed(1)}°,{p.lng.toFixed(1)}°</span></span>
                <span className="text-[var(--rising)]">{fmt(p.value, lang, 2)}</span>
              </li>
            ))}
          </ol>
          <h3 className="mt-4 text-xs uppercase tracking-wide text-muted-foreground">{L("Lowest measured samples", "সর্বনিম্ন কোষ")}</h3>
          <ol className="mt-1 space-y-1 text-sm">
            {sorted.slice(-5).reverse().map((p) => (
              <li key={`${p.lat},${p.lng}`} className="flex justify-between font-mono text-foreground">
                <span className="font-sans">{placeName(p.lat, p.lng)} <span className="text-[10px] text-muted-foreground font-mono">{p.lat.toFixed(1)}°,{p.lng.toFixed(1)}°</span></span>
                <span className="text-[var(--declining)]">{fmt(p.value, lang, 2)}</span>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <ProvenanceButton
              provenance={grid.provenance}
              title={L(LABELS[variable].en, LABELS[variable].bn)}
              payload={{ samples: scope === "world" ? grid.cells.map(c=>({place:c.place,latitude:c.lat,longitude:c.lng,provenance:c.provenance})) : [], variable, unit, mode, year: mode === "year" ? activeYear : null, n_cells: points.length, provenance: grid.provenance, points: points.slice(0, 20) }}
            />
            <Button type="button" variant="outline" size="sm" onClick={() => exportGridCsv(buildExport(), `terra-earth-${variable}-cells.csv`)}>
              {L("Download CSV", "CSV ডাউনলোড")}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => void exportGridPdf(buildExport(), `terra-earth-${variable}-cells.pdf`)}>
              {L("Download PDF", "PDF ডাউনলোড")}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
