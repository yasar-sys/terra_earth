import { useEffect, useMemo, useState, type ComponentType, type KeyboardEvent, type SVGProps } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, BookOpenCheck, Check, CloudRain, Heart, Info, Leaf, MapPin, Minus, Sprout, Sun, ThermometerSun, TrendingDown, TrendingUp, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { analyzeVariable, availableVariables, districts, getDistrict, type VariableAnalysis, type VariableKey } from "@/lib/climate";
import { fmt, useLang, type Lang } from "@/lib/i18n";
import { getFavoriteDistrictIds, saveLearningAttempt, toggleFavoriteDistrict } from "@/lib/learning.functions";
import districtGeo from "@/data/bangladesh-districts.geojson.json";
import type { MascotState } from "@/components/KidsMascot";

type Trend = "up" | "down" | "same";
type Icon = ComponentType<SVGProps<SVGSVGElement>>;
type GeoFeature = { properties: { districtId: string; name: string }; geometry: { type: "Polygon" | "MultiPolygon"; coordinates: number[][][] | number[][][][] } };

const LABELS: Record<VariableKey, { en: string; bn: string; icon: Icon }> = {
  ndvi: { en: "Vegetation", bn: "উদ্ভিদ", icon: Sprout },
  lst: { en: "Land temperature", bn: "ভূপৃষ্ঠের তাপমাত্রা", icon: ThermometerSun },
  temperature: { en: "Air temperature", bn: "বায়ুর তাপমাত্রা", icon: Wind },
  solar: { en: "Sunlight", bn: "সূর্যালোক", icon: Sun },
  precipitation: { en: "Rainfall", bn: "বৃষ্টিপাত", icon: CloudRain },
};
const TRENDS: Record<Trend, { en: string; bn: string; icon: Icon }> = {
  up: { en: "Increased", bn: "বেড়েছে", icon: TrendingUp },
  down: { en: "Decreased", bn: "কমেছে", icon: TrendingDown },
  same: { en: "No clear change", bn: "স্পষ্ট পরিবর্তন নেই", icon: Minus },
};

function pathFor(feature: GeoFeature) {
  const polygons = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates as number[][][]] : feature.geometry.coordinates as number[][][][];
  return polygons.flatMap((polygon) => polygon).map((ring) => ring.map(([lng, lat], index) => `${index ? "L" : "M"}${(((Number(lng) - 88) / 5) * 240).toFixed(1)},${(((26.7 - Number(lat)) / 6.3) * 300).toFixed(1)}`).join(" ") + " Z").join(" ");
}

function DistrictMap({ activeId, onSelect, lang }: { activeId: string; onSelect: (id: string) => void; lang: Lang }) {
  const chooseFromKey = (event: KeyboardEvent<SVGPathElement>, id: string) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onSelect(id);
  };
  return <svg viewBox="0 0 240 300" className="learn-map" role="group" aria-label={lang === "bn" ? "বাংলাদেশের ৬৪ জেলার মানচিত্র" : "Map of the 64 districts of Bangladesh"}>{(districtGeo.features as GeoFeature[]).map((feature) => { const active = feature.properties.districtId === activeId; return <path key={feature.properties.districtId} d={pathFor(feature)} className={active ? "learn-map-active" : "learn-map-district"} role="button" tabIndex={0} aria-pressed={active} aria-label={lang === "bn" ? (districts.find(d => d.id === feature.properties.districtId)?.bn ?? feature.properties.name) : feature.properties.name} onClick={() => onSelect(feature.properties.districtId)} onKeyDown={(event) => chooseFromKey(event, feature.properties.districtId)}><title>{feature.properties.name}</title></path>; })}</svg>;
}

function pValue(value: number) { return value < 0.001 ? "< 0.001" : value.toFixed(3); }

function evidenceSentence(analysis: VariableAnalysis, districtName: string, lang: Lang) {
  const { trend } = analysis.result;
  const slope = analysis.result.slope.slope_per_decade;
  const years = analysis.result.period.end - analysis.result.period.start;
  const label = LABELS[analysis.variable][lang];
  const p = pValue(trend.p_value);
  if (!Number.isFinite(trend.p_value) || !Number.isFinite(slope)) return null;
  if (!trend.significant_at_0_05) return lang === "bn"
    ? `${years.toLocaleString("bn-BD")} বছরে ${districtName}-এর ${label} মোটামুটি স্থিতিশীল ছিল (p = ${p}; পরিসংখ্যানগতভাবে তাৎপর্যপূর্ণ নয়)।`
    : `${label} in ${districtName} stayed roughly stable over ${years} years (p = ${p}; not statistically significant).`;
  const direction = slope > 0 ? (lang === "bn" ? "বেড়েছে" : "risen") : (lang === "bn" ? "কমেছে" : "declined");
  const amount = fmt(Math.abs(slope), lang, analysis.variable === "ndvi" ? 3 : 2);
  return lang === "bn"
    ? `${districtName}-এর ${label} উল্লেখযোগ্যভাবে ${direction}—প্রতি দশকে প্রায় ${amount} ${analysis.unit} (p = ${p})।`
    : `${label} in ${districtName} has ${direction} significantly, by about ${amount} ${analysis.unit} per decade (p = ${p}).`;
}

function learningSentence(analysis: VariableAnalysis, lang: Lang) {
  if (!analysis.result.trend.significant_at_0_05) return lang === "bn"
    ? "শিখলাম: শুধু প্রথম ও শেষ মান আলাদা হলেই দীর্ঘমেয়াদি পরিবর্তন প্রমাণ হয় না। বহু বছরের সব রেকর্ড ও p-value একসঙ্গে দেখে সিদ্ধান্ত নিতে হয়।"
    : "What you learned: Different first and last values do not prove a long-term change. Scientists consider every annual record and the p-value together.";
  return lang === "bn"
    ? "শিখলাম: বহু বছরের রেকর্ড একই দিকে ধারাবাহিক পরিবর্তন দেখালে এবং p-value ০.০৫-এর কম হলে বিজ্ঞানীরা পরিবর্তনটিকে পরিসংখ্যানগতভাবে তাৎপর্যপূর্ণ বলেন।"
    : "What you learned: When many years of records show a consistent direction and the p-value is below 0.05, scientists call the change statistically significant.";
}

export function DistrictLearning({ onMascotState, onContextChange }: { onMascotState?: (state: MascotState) => void; onContextChange?: (context: { districtId: string; district: string; variable: string; significant: boolean }) => void }) {
  const { lang } = useLang();
  const L = (en: string, bn: string) => lang === "bn" ? bn : en;
  const [districtId, setDistrictId] = useState("dhaka");
  const variables = availableVariables(districtId);
  const [variable, setVariable] = useState<VariableKey>("lst");
  const [picked, setPicked] = useState<Trend | null>(null);
  const [favorite, setFavorite] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const saveAttempt = useServerFn(saveLearningAttempt);
  const toggleFavorite = useServerFn(toggleFavoriteDistrict);
  const listFavorites = useServerFn(getFavoriteDistrictIds);
  const activeVariable = variables.includes(variable) ? variable : variables[0] ?? "temperature";
  const analysis = useMemo(() => analyzeVariable(districtId, activeVariable), [districtId, activeVariable]);
  const district = getDistrict(districtId);
  const districtName = lang === "bn" ? district?.bn ?? districtId : district?.name ?? districtId;
  const correct: Trend = !analysis?.result.trend.significant_at_0_05 ? "same" : (analysis.result.slope.slope_per_decade ?? 0) > 0 ? "up" : "down";
  const evidence = analysis ? evidenceSentence(analysis, districtName, lang) : null;
  const ActiveVariableIcon = LABELS[activeVariable].icon;

  useEffect(() => {
    onContextChange?.({ districtId, district: districtName, variable: LABELS[activeVariable][lang], significant: Boolean(analysis?.result.trend.significant_at_0_05) });
  }, [activeVariable, analysis?.result.trend.significant_at_0_05, districtName, lang, onContextChange]);

  const chooseDistrict = (id: string) => { onMascotState?.("thinking"); setDistrictId(id); setPicked(null); setSaveMessage(""); const next = availableVariables(id); const first = next.at(0); if (first && !next.includes(variable)) setVariable(first); };
  const chooseVariable = (key: VariableKey) => { onMascotState?.("thinking"); setVariable(key); setPicked(null); setSaveMessage(""); };
  const answer = async (choice: Trend) => {
    setPicked(choice);
    onMascotState?.(choice === correct && analysis?.result.trend.significant_at_0_05 ? "celebrating" : choice === correct ? "idle" : "encouraging");
    const { data } = await supabase.auth.getUser();
    if (!data.user) { setSaveMessage(L("Sign in to save this observation.", "এই পর্যবেক্ষণ সেভ করতে সাইন ইন করো।")); return; }
    try { await saveAttempt({ data: { districtId, variable: activeVariable, selectedTrend: choice } }); setSaveMessage(L("Observation saved to your profile.", "পর্যবেক্ষণটি তোমার প্রোফাইলে সেভ হয়েছে।")); } catch { setSaveMessage(L("The observation could not be saved.", "পর্যবেক্ষণটি সেভ করা যায়নি।")); }
  };
  const updateFavorite = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) { setSaveMessage(L("Sign in to save favorite districts.", "প্রিয় জেলা সেভ করতে সাইন ইন করো।")); return; }
    const next = !favorite;
    await toggleFavorite({ data: { districtId, favorite: next } });
    setFavorite(next);
    setSaveMessage(next ? L("District saved to favorites.", "জেলাটি প্রিয় তালিকায় সেভ হয়েছে।") : L("District removed from favorites.", "জেলাটি প্রিয় তালিকা থেকে সরানো হয়েছে।"));
  };
  useEffect(() => { void supabase.auth.getUser().then(async ({ data }) => { if (!data.user) return; try { setFavorite((await listFavorites()).includes(districtId)); } catch { setFavorite(false); } }); }, [districtId, listFavorites]);

  return <section className="learn-studio" aria-labelledby="learn-title">
    <header className="learn-header scroll-reveal">
      <div><p className="learn-eyebrow"><Leaf /> {L("A guided Earth observation", "নির্দেশিত পৃথিবী পর্যবেক্ষণ")}</p><h1 id="learn-title">{L("Bangladesh in My Hands", "আমার হাতে বাংলাদেশ")}</h1><p>{L("Explore measured change across Bangladesh, one district and one climate record at a time.", "একটি জেলা ও একটি জলবায়ু রেকর্ড ধরে বাংলাদেশের পরিমাপ করা পরিবর্তন অনুসন্ধান করো।")}</p></div>
      <div className="learn-record"><span>{L("Evidence coverage", "উপাত্তের আওতা")}</span><strong>{lang === "bn" ? "৬৪ জেলা" : "64 districts"}</strong><small>{L("NASA Earth observations", "নাসা আর্থ অবজারভেশনস")}</small></div>
    </header>

    <div className="learn-layout scroll-reveal">
      <aside className="learn-picker" aria-label={L("District selector", "জেলা নির্বাচন")}>
        <div className="learn-picker-heading"><div><span>{L("Explore by place", "স্থান ধরে অনুসন্ধান")}</span><h2>{L("Choose a district", "জেলা বেছে নাও")}</h2></div><MapPin /></div>
        <DistrictMap activeId={districtId} onSelect={chooseDistrict} lang={lang} />
        <div className="learn-selected-place"><span>{L("Selected district", "নির্বাচিত জেলা")}</span><strong>{districtName}</strong><small>{district?.division}</small></div>
        <label className="learn-select-label">{L("District list", "জেলার তালিকা")}<select value={districtId} onChange={(event) => chooseDistrict(event.target.value)}>{districts.map((item) => <option key={item.id} value={item.id}>{lang === "bn" ? item.bn : item.name}</option>)}</select></label>
      </aside>

      <div className="learn-content">
        <div className="learn-toolbar">
          <div className="learn-tabs" role="tablist" aria-label={L("Climate record", "জলবায়ু রেকর্ড")}>{variables.map((key) => { const IconComponent = LABELS[key].icon; const active = activeVariable === key; return <Button key={key} type="button" variant="ghost" role="tab" aria-selected={active} className={active ? "is-active" : ""} onClick={() => chooseVariable(key)}><IconComponent />{LABELS[key][lang]}</Button>; })}</div>
          <Button type="button" size="icon" variant="outline" className="learn-favorite" onClick={updateFavorite} aria-label={favorite ? L("Remove favorite district", "প্রিয় জেলা থেকে সরাও") : L("Save favorite district", "প্রিয় জেলা সেভ করো")} title={favorite ? L("Remove favorite", "প্রিয় থেকে সরাও") : L("Save favorite", "প্রিয় হিসেবে সেভ করো")}><Heart className={favorite ? "fill-current text-accent" : ""} /></Button>
        </div>

        {analysis ? <div key={`${districtId}-${activeVariable}`} className="learn-evidence-transition">
          <div className="learn-comparison">
            <article className="learn-period-card is-earlier"><div className="learn-period-top"><span>{L("Earlier record", "আগের রেকর্ড")}</span><strong>{analysis.result.period.start}</strong></div><div className="learn-measure-icon"><ActiveVariableIcon /></div><div><b>{fmt(analysis.result.first_value ?? 0, lang, activeVariable === "ndvi" ? 2 : 1)}</b><small>{analysis.unit}</small></div></article>
            <div className="learn-time" aria-hidden><span/><ArrowRight /></div>
            <article className="learn-period-card is-recent"><div className="learn-period-top"><span>{L("Recent record", "সাম্প্রতিক রেকর্ড")}</span><strong>{analysis.result.period.end}</strong></div><div className="learn-measure-icon"><ActiveVariableIcon /></div><div><b>{fmt(analysis.result.current_value ?? 0, lang, activeVariable === "ndvi" ? 2 : 1)}</b><small>{analysis.unit}</small></div></article>
          </div>
          {evidence ? <div className={`learn-insight ${analysis.result.trend.significant_at_0_05 ? "is-significant" : "is-neutral"}`}><Info /><div><span>{L("What the trend test says", "প্রবণতা পরীক্ষায় যা দেখা যায়")}</span><p>{evidence}</p></div></div> : null}
          <p className="learn-source">NASA · {analysis.provenance.dataset_id} · {L(`${analysis.result.n_observations} annual observations`, `${analysis.result.n_observations.toLocaleString("bn-BD")}টি বার্ষিক পর্যবেক্ষণ`)}</p>

          <section className="learn-question" aria-labelledby="observation-question"><p className="learn-section-label">{L("Check your observation", "তোমার পর্যবেক্ষণ মিলিয়ে দেখো")}</p><h2 id="observation-question">{L(`What does the long-term ${LABELS[activeVariable].en.toLowerCase()} record show?`, `দীর্ঘমেয়াদি ${LABELS[activeVariable].bn} রেকর্ডে কী দেখা যায়?`)}</h2><div className="learn-answers">{(Object.keys(TRENDS) as Trend[]).map((trend) => { const IconComponent = TRENDS[trend].icon; return <Button key={trend} variant="outline" disabled={picked !== null} onClick={() => void answer(trend)} className={picked ? trend === correct ? "is-correct" : trend === picked ? "is-wrong" : "" : ""}><IconComponent /><span>{TRENDS[trend][lang]}</span>{picked && trend === correct ? <Check /> : null}</Button>; })}</div>{picked ? <div className="learn-feedback" role="status"><p>{picked === correct ? L("Your observation matches the statistical test.", "তোমার পর্যবেক্ষণটি পরিসংখ্যানগত পরীক্ষার সঙ্গে মিলেছে।") : L("Compare your choice with the highlighted statistical result.", "তোমার পছন্দটি চিহ্নিত পরিসংখ্যানগত ফলাফলের সঙ্গে মিলিয়ে দেখো।")}</p><div className="learn-answer-row"><span>{L("Correct answer", "সঠিক উত্তর")}</span><strong>{TRENDS[correct][lang]}</strong></div><small>{L("Theil–Sen rate per decade", "প্রতি দশকে থেইল–সেন হার")}: {analysis.result.slope.slope_per_decade > 0 ? "+" : ""}{fmt(analysis.result.slope.slope_per_decade, lang, 2)} {analysis.unit} · p = {pValue(analysis.result.trend.p_value)}</small><p className="learn-takeaway"><BookOpenCheck aria-hidden />{learningSentence(analysis, lang)}</p>{saveMessage ? <p className="learn-save-note">{saveMessage}</p> : null}</div> : saveMessage ? <p className="learn-save-note" role="status">{saveMessage}</p> : null}</section>
        </div> : <div className="learn-empty">{L("Data not yet available for this district.", "এই জেলার তথ্য এখনো পাওয়া যায়নি।")}</div>}
      </div>
    </div>
    <p className="learn-honesty"><Info />{L("Every number comes from cached NASA records. The guide illustration explains the interface; it does not represent measured evidence.", "প্রতিটি সংখ্যা সংরক্ষিত NASA রেকর্ড থেকে এসেছে। গাইডের ছবিটি ইন্টারফেস বোঝায়; এটি পরিমাপ করা প্রমাণ নয়।")}</p>
  </section>;
}