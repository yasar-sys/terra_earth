import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ArrowLeft, Check, LockKeyhole, RotateCcw, Search, Star, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { analyzeVariable, getDistrict, type VariableAnalysis, type VariableKey } from "@/lib/climate";
import districtGeo from "@/data/bangladesh-districts.geojson.json";

type Bi = { en: string; bn: string };
type MissionId = "padma" | "sundarbans" | "village" | "dhaka";
type Trend = "up" | "down" | "same";
type Screen = "map" | MissionId | "final" | "award";
type DetectiveState = "idle" | "thinking" | "celebrate";

interface Mission {
  id: MissionId;
  number: number;
  icon: string;
  name: Bi;
  place: Bi;
  prompt: Bi;
  correct: Trend;
  clue: Bi;
  success: Bi;
  districtId: string;
  variable: VariableKey;
}

const MISSIONS: Mission[] = [
  {
    id: "padma",
    number: 1,
    icon: "🌊",
    name: { en: "Padma River Mystery", bn: "পদ্মা নদীর রহস্য" },
    place: { en: "Padma River", bn: "পদ্মা নদী" },
    prompt: { en: "Look at the blue water. What changed?", bn: "নীল পানির দিকে দেখো। কী বদলেছে?" },
    correct: "down",
    clue: { en: "Water level: decreased", bn: "পানির স্তর: কমেছে" },
    success: { en: "Great! You found a trend!", bn: "দারুণ! তুমি একটি প্রবণতা খুঁজে পেয়েছ!" },
    districtId: "rajshahi",
    variable: "precipitation",
  },
  {
    id: "sundarbans",
    number: 2,
    icon: "🌳",
    name: { en: "Sundarbans Detective", bn: "সুন্দরবন গোয়েন্দা" },
    place: { en: "Sundarbans", bn: "সুন্দরবন" },
    prompt: { en: "Which picture changed? Tap it!", bn: "কোন ছবিটি বদলেছে? সেটিতে চাপ দাও!" },
    correct: "down",
    clue: { en: "Mangrove trees: decreased", bn: "ম্যানগ্রোভ গাছ: কমেছে" },
    success: { en: "Excellent! You found another clue!", bn: "চমৎকার! তুমি আরেকটি সূত্র পেয়েছ!" },
    districtId: "satkhira",
    variable: "ndvi",
  },
  {
    id: "village",
    number: 3,
    icon: "🌾",
    name: { en: "Village Weather Detective", bn: "গ্রামের আবহাওয়া গোয়েন্দা" },
    place: { en: "Bangladesh Village", bn: "বাংলাদেশের গ্রাম" },
    prompt: { en: "What rain trend do you see?", bn: "বৃষ্টির কী প্রবণতা দেখতে পাচ্ছ?" },
    correct: "down",
    clue: { en: "Rain symbols: decreased", bn: "বৃষ্টির চিহ্ন: কমেছে" },
    success: { en: "Sharp eyes! The rain symbols became fewer.", bn: "তীক্ষ্ণ নজর! বৃষ্টির চিহ্ন কমে গেছে।" },
    districtId: "mymensingh",
    variable: "precipitation",
  },
  {
    id: "dhaka",
    number: 4,
    icon: "🏙️",
    name: { en: "Dhaka City Mystery", bn: "ঢাকা শহরের রহস্য" },
    place: { en: "Dhaka City", bn: "ঢাকা শহর" },
    prompt: { en: "What increased? Tap the changed object!", bn: "কী বেড়েছে? বদলে যাওয়া বস্তুতে চাপ দাও!" },
    correct: "up",
    clue: { en: "Buildings: increased", bn: "ভবন: বেড়েছে" },
    success: { en: "Mystery solved! You spotted more buildings.", bn: "রহস্য সমাধান! তুমি বেশি ভবন খুঁজে পেয়েছ।" },
    districtId: "dhaka",
    variable: "lst",
  },
];

const TREND_LABELS: Record<Trend, { icon: string; label: Bi }> = {
  up: { icon: "⬆️", label: { en: "Increased", bn: "বেড়েছে" } },
  down: { icon: "⬇️", label: { en: "Decreased", bn: "কমেছে" } },
  same: { icon: "➡️", label: { en: "Almost the same", bn: "প্রায় একই" } },
};

const VARIABLE_NAMES: Record<VariableKey, Bi> = {
  ndvi: { en: "Vegetation", bn: "উদ্ভিদ" },
  lst: { en: "Land temperature", bn: "ভূপৃষ্ঠের তাপমাত্রা" },
  temperature: { en: "Air temperature", bn: "বায়ুর তাপমাত্রা" },
  solar: { en: "Sunlight", bn: "সূর্যালোক" },
  precipitation: { en: "Rainfall", bn: "বৃষ্টিপাত" },
};

type GeoFeature = {
  properties: { districtId: string; name: string };
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: number[][][] | number[][][][] };
};

function ringsOf(feature: GeoFeature): number[][][] {
  if (feature.geometry.type === "Polygon") return feature.geometry.coordinates as number[][][];
  return (feature.geometry.coordinates as number[][][][]).flatMap((polygon) => polygon);
}

function mapPath(feature: GeoFeature) {
  return ringsOf(feature).map((ring) => ring.map(([lng, lat], index) => {
    const x = ((Number(lng) - 88) / 5) * 240;
    const y = ((26.7 - Number(lat)) / 6.3) * 300;
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ") + " Z").join(" ");
}

function BangladeshDistrictMap({ activeId }: { activeId?: string }) {
  const features = (districtGeo.features as GeoFeature[]);
  return <svg viewBox="0 0 240 300" className="td-district-map" role="img" aria-label="Bangladesh map with all 64 district boundaries">
    {features.map((feature) => <path key={feature.properties.districtId} d={mapPath(feature)} className={feature.properties.districtId === activeId ? "td-district-active" : "td-district-shape"}/>) }
  </svg>;
}

function trendFromAnalysis(analysis: VariableAnalysis | null): Trend {
  if (!analysis) return "same";
  if (!analysis.result.trend.significant_at_0_05) return "same";
  return analysis.result.slope.slope_per_decade > 0 ? "up" : "down";
}

function DataWeatherCard({ mission, analysis, lang }: { mission: Mission; analysis: VariableAnalysis | null; lang: "en" | "bn" }) {
  const district = getDistrict(mission.districtId);
  if (!analysis || !district) return <div className="td-data-weather">{lang === "bn" ? "এই জেলার তথ্য এখনো পাওয়া যায়নি" : "Data not yet available for this district"}</div>;
  const current = analysis.result.current_value;
  const slope = analysis.result.slope.slope_per_decade;
  const direction = trendFromAnalysis(analysis);
  return <aside className={`td-data-weather td-weather-${direction}`} aria-label={lang === "bn" ? "বাস্তব তথ্যের সারাংশ" : "Real data summary"}>
    <div className="td-data-map"><BangladeshDistrictMap activeId={mission.districtId}/><span>{lang === "bn" ? district.bn : district.name}</span></div>
    <div className="td-data-copy"><p className="td-live-label"><i/> {lang === "bn" ? "NASA বার্ষিক রেকর্ড" : "NASA ANNUAL RECORD"}</p><h4>{VARIABLE_NAMES[mission.variable][lang]}</h4><p className="td-reading"><strong>{current?.toFixed(mission.variable === "ndvi" ? 2 : 1)}</strong> {analysis.unit} <span>({analysis.result.period.end})</span></p><p>{lang === "bn" ? "প্রতি দশকে" : "Per decade"}: <b>{slope > 0 ? "+" : ""}{slope.toFixed(2)} {analysis.unit}</b></p><p className="td-trend-state">{TREND_LABELS[direction].icon} {TREND_LABELS[direction].label[lang]} {analysis.result.trend.significant_at_0_05 ? "✓" : `· ${lang === "bn" ? "স্পষ্ট নয়" : "not clear"}`}</p><small>{analysis.provenance.dataset_id} · {analysis.result.period.start}–{analysis.result.period.end}</small></div>
    <div className="td-weather-reaction" aria-hidden="true">{mission.variable === "precipitation" ? (direction === "up" ? "🌧️" : "🌦️") : mission.variable === "ndvi" ? (direction === "up" ? "🌳" : "🌿") : direction === "up" ? "🥵" : "🌤️"}</div>
  </aside>;
}

function Detective({ state = "idle" }: { state?: DetectiveState }) {
  return (
    <svg viewBox="0 0 150 170" className={`td-detective ${state === "celebrate" ? "td-jump" : state === "thinking" ? "td-thinking" : "td-float"}`} aria-hidden="true">
      <ellipse className="td-shadow" cx="75" cy="161" rx="38" ry="7" />
      <path className="td-coat" d="M40 156q4-48 35-52 31 4 35 52z" />
      <circle className="td-skin" cx="75" cy="70" r="34" />
      <path className="td-hair" d="M44 65q3-35 31-35t33 35q-14-16-30-14-18 1-34 14z" />
      <path className="td-hat" d="M35 42h80q-9-13-21-14l-5-19H57l-4 19q-12 2-18 14z" />
      <path className="td-hat-band" d="M54 27h42l-3-9H57z" />
      <circle className="td-ink" cx="63" cy="70" r="3" /><circle className="td-ink" cx="87" cy="70" r="3" />
      <path className="td-line" d={state === "thinking" ? "M67 85q8-3 16 0" : "M66 84q9 8 18 0"} />
      <path className="td-shirt" d="M60 110l15 17 15-17 12 46H48z" />
      <g transform="translate(99 101) rotate(-22)"><circle className="td-glass" cx="0" cy="0" r="20" /><path className="td-glass-line" d="M15 15l24 24" /></g>
    </svg>
  );
}

function WeatherFriends() {
  return <div className="td-weather-friends" aria-hidden="true">
    <div className="td-weather-sun"><span>•‿•</span></div>
    <div className="td-weather-cloud"><span>•ᴗ•</span><i/><i/><i/></div>
  </div>;
}

function SceneDecor({ kind, now, trend = "same", revealed = false }: { kind: MissionId; now: boolean; trend?: Trend; revealed?: boolean }) {
  if (kind === "padma") {
    const top = !now || trend === "same" ? 122 : trend === "up" ? 103 : 145;
    return <svg viewBox="0 0 360 220" className="h-full w-full" role="img" aria-label={now ? "Now: lower illustrated river water" : "Before: higher illustrated river water"}>
      <g className="td-layer td-layer-back"><rect className="td-sky" width="360" height="220" /><g className="td-sun-friend"><circle className="td-sun" cx="305" cy="38" r="22"/><circle className="td-ink" cx="297" cy="36" r="2"/><circle className="td-ink" cx="313" cy="36" r="2"/><path className="td-line" d="M299 45q6 5 12 0"/></g><path className="td-distant-bank" d="M0 103q70-23 140 0t140 0 80 0v35H0z"/></g>
      <g className="td-layer td-layer-mid"><path className="td-bank" d={`M0 ${top - 20}q95-23 180 0t180 0v100H0z`} /><path className={`td-water td-wave ${revealed ? "td-clue-found" : "td-clue-hint"}`} d={`M0 ${top}q70-18 140 0t140 0 80 0v80H0z`} /><path className="td-ripple td-ripple-one" d={`M25 ${top + 23}q36-8 72 0`}/><path className="td-ripple td-ripple-two" d={`M218 ${top + 48}q38-8 76 0`}/></g>
      <g className="td-layer td-layer-front"><g transform="translate(62 96)" className="td-foliage-sway"><path className="td-tree" d="M0 40V5" /><circle className="td-leaf" cy="-2" r="22" /></g><g transform={`translate(${now ? 226 : 202} ${top - 10})`} className="td-boat td-boat-drift"><path className="td-boat-hull" d="M-35 0h70l-10 15h-48z" /><path className="td-line" d="M0 0v-35" /><path className="td-sail" d="M2-34v27h27z" /></g><g transform={`translate(150 ${top + 28})`} className="td-fish"><path className="td-fish-body" d="M-15 0q15-14 30 0-15 14-30 0m-1 0-13-10v20z" /><circle className="td-ink" cx="8" cy="-2" r="1.5" /></g></g>
    </svg>;
  }
  if (kind === "sundarbans") {
    const trees = !now || trend === "same" ? [52, 112, 175, 238] : trend === "up" ? [40, 88, 136, 184, 232] : [68, 154];
    return <svg viewBox="0 0 360 220" className="h-full w-full" role="img" aria-label={now ? "Now: fewer illustrated mangrove trees" : "Before: more illustrated mangrove trees"}>
      <g className="td-layer td-layer-back"><rect className="td-sky" width="360" height="220" /><g className="td-cloud-drift"><path className="td-cloud-shape" d="M250 54c0-13 11-23 24-21 5-15 27-16 34-2 17-3 29 8 29 22z"/><circle className="td-ink" cx="283" cy="45" r="2"/><circle className="td-ink" cx="297" cy="45" r="2"/><path className="td-line" d="M285 51q5 4 10 0"/></g><g className="td-bird-flight"><path className="td-bird" d="M0 0q7-8 14 0 7-8 14 0"/></g></g><g className="td-layer td-layer-mid"><path className="td-water td-wave" d="M0 157q90-15 180 0t180 0v63H0z" />
      <g className={revealed ? "td-clue-found" : "td-clue-hint"}>{trees.map((x, index) => <g key={x} transform={`translate(${x} 135)`} className={`td-foliage-sway td-sway-${index % 2}`}><path className="td-trunk" d="M0 35V0m0 14-14 24m14-18 14 18" /><circle className="td-leaf" cy="-9" r="24" /></g>)}</g></g>
      <g className="td-layer td-layer-front"><g transform="translate(276 160)" className="td-boat"><path className="td-boat-hull" d="M-29 0h58l-8 12h-42z" /><path className="td-line" d="M0 0v-29" /><path className="td-sail" d="M2-28v22h22z" /></g>
      <g transform="translate(217 187)"><path className="td-fish-body" d="M-11 0q11-9 22 0-11 9-22 0m-1 0-9-7v14z" /></g>
      <g transform="translate(309 131)"><ellipse className="td-deer" rx="17" ry="10"/><circle className="td-deer" cx="18" cy="-10" r="8"/><path className="td-line" d="M-10 8v16m20-16v16m13-24 5-11m-5 11-2-12" /></g></g>
    </svg>;
  }
  if (kind === "village") {
    return <svg viewBox="0 0 360 220" className="h-full w-full" role="img" aria-label="Illustrated Bangladesh village with rice field, farmer, pond and rain">
      <g className="td-layer td-layer-back"><rect className="td-sky" width="360" height="220" /><g className="td-cloud td-cloud-drift" transform="translate(75 44)"><circle cx="0" cy="0" r="20"/><circle cx="25" cy="-8" r="27"/><circle cx="52" cy="2" r="20"/><rect x="0" y="0" width="55" height="20"/><circle className="td-ink" cx="18" cy="3" r="2"/><circle className="td-ink" cx="34" cy="3" r="2"/><path className="td-line" d="M20 10q6 4 12 0"/></g></g>
      {[74,102,130].map((x) => <path key={x} className="td-rain" d={`M${x} 70v18`} />)}
      <g className="td-layer td-layer-mid"><path className="td-field" d="M0 125q90-16 180 0t180 0v95H0z" /><ellipse className="td-water td-wave" cx="278" cy="170" rx="62" ry="26" /><g transform="translate(52 112)"><rect className="td-house" x="0" y="20" width="70" height="55"/><path className="td-roof" d="M-8 23 35-8l43 31z"/><rect className="td-door" x="27" y="47" width="17" height="28"/><g className="td-smoke"><circle cx="56" cy="-2" r="5"/><circle cx="60" cy="-14" r="7"/><circle cx="54" cy="-27" r="9"/></g></g></g>
      <g className="td-layer td-layer-front">
      <g transform="translate(175 137)"><circle className="td-skin" cy="-17" r="9"/><path className="td-hat" d="M-14-22h28l-7-7H-7z"/><path className="td-shirt" d="M0-8v34m0-4-16 24m16-24 16 24m-1-37 15 18M-15 9-28 24" /></g>
      <g className={revealed ? "td-clue-found" : "td-clue-hint"}>{Array.from({ length: 7 }).map((_, i) => <path key={i} className={`td-rice td-rice-${i % 2}`} d={`M${18 + i * 30} 178v30m0-18-9-9m9 16 9-9`} />)}</g><g className="td-water-wheel" transform="translate(274 165)"><circle cx="0" cy="0" r="18"/><path d="M-24 0h48M0-24v48M-17-17l34 34M17-17l-34 34"/></g></g>
    </svg>;
  }
  const buildings = [45, 105, 172, 238];
  return <svg viewBox="0 0 360 220" className="h-full w-full" role="img" aria-label={now ? "Now: more illustrated city buildings" : "Earlier: fewer illustrated city buildings"}>
    <g className="td-layer td-layer-back"><rect className="td-sky td-city-sky" width="360" height="220" /><g className={now ? "td-sun-friend td-sun-hot" : "td-sun-friend"}><circle className="td-sun" cx="310" cy="35" r="21"/><circle className="td-ink" cx="303" cy="33" r="2"/><circle className="td-ink" cx="317" cy="33" r="2"/><path className="td-line" d={now ? "M303 44q7-5 14 0" : "M303 42q7 6 14 0"}/>{now && <path className="td-rain" d="M326 40q7 8 0 14q-7-6 0-14"/>}</g><path className="td-cloud-shape td-city-cloud" d="M5 48c8-18 28-17 36-3 15-5 29 5 30 18H4z"/></g>
    <g className={`td-layer td-layer-mid ${revealed ? "td-clue-found" : "td-clue-hint"}`}>{buildings.map((x, i) => <g key={x}><rect className={i % 2 ? "td-building-alt" : "td-building"} x={x} y={80 - (i % 3) * 16} width="42" height={104 + (i % 3) * 16}/>{[0,1,2].map(r => [0,1].map(c => <rect key={`${r}-${c}`} className={`td-window td-window-${(r+c+i)%3}`} x={x + 8 + c*18} y={94 + r*23 - (i % 3)*16} width="8" height="10"/>))}</g>)}</g>
    <g className="td-layer td-layer-front"><path className="td-road" d="M0 178h360v42H0z"/><path className="td-road-line" d="M0 199h360"/><g transform="translate(87 186)" className="td-car"><rect className="td-car-body" x="-25" y="0" width="50" height="20" rx="6"/><path className="td-car-body" d="M-14 0-5-12h21l12 12"/><circle className="td-wheel" cx="-14" cy="20" r="6"/><circle className="td-wheel" cx="16" cy="20" r="6"/></g><g transform="translate(287 151)" className="td-foliage-sway"><path className="td-trunk" d="M0 32V0"/><circle className="td-leaf" cy="-7" r="20"/></g></g>
  </svg>;
}

function SceneCard({ label, kind, now, trend, revealed }: { label: string; kind: MissionId; now: boolean; trend: Trend; revealed?: boolean }) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const move = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--td-px", `${((event.clientX - box.left) / box.width - 0.5) * 2}`);
    event.currentTarget.style.setProperty("--td-py", `${((event.clientY - box.top) / box.height - 0.5) * 2}`);
  };
  const reset = () => { sceneRef.current?.style.setProperty("--td-px", "0"); sceneRef.current?.style.setProperty("--td-py", "0"); };
  return <div ref={sceneRef} onPointerMove={move} onPointerLeave={reset} className={`td-scene-card overflow-hidden rounded-2xl border-4 border-game-ink bg-game-paper shadow-game ${revealed ? "td-scene-revealed" : ""}`}>
    <div className="bg-game-ink px-3 py-2 text-center text-sm font-black uppercase text-game-paper">{label}</div>
    <div className="td-scene-stage aspect-[16/10]"><SceneDecor kind={kind} now={now} trend={trend} revealed={revealed ?? false} />{revealed && <div className="td-clue-burst" aria-hidden="true"><i/><i/><i/><i/><i/><i/></div>}</div>
  </div>;
}

function TrendChoices({ lang, onChoose }: { lang: "en" | "bn"; onChoose: (trend: Trend) => void }) {
  return <div className="grid grid-cols-3 gap-2 sm:gap-3">
    {(Object.keys(TREND_LABELS) as Trend[]).map((trend) => <Button key={trend} type="button" variant="outline" onClick={() => onChoose(trend)} className="td-pressable h-auto min-h-20 flex-col whitespace-normal border-2 border-game-ink bg-game-paper px-2 py-3 text-center text-game-ink shadow-game hover:bg-game-yellow">
      <span className="text-2xl" aria-hidden="true">{TREND_LABELS[trend].icon}</span><span className="text-xs font-black sm:text-sm">{TREND_LABELS[trend].label[lang]}</span>
    </Button>)}
  </div>;
}

function SoundToggle({ muted, lang, onToggle }: { muted: boolean; lang: "en" | "bn"; onToggle: () => void }) {
  const label = muted ? (lang === "bn" ? "শব্দ চালু করো" : "Turn sound on") : (lang === "bn" ? "শব্দ বন্ধ করো" : "Mute sound");
  return <Button type="button" size="icon" variant="ghost" onClick={onToggle} className="td-sound-toggle" aria-label={label} title={label}>{muted ? <VolumeX/> : <Volume2/>}</Button>;
}

function TravelTransition({ mission, lang }: { mission: Mission; lang: "en" | "bn" }) {
  return <div className="td-travel" role="status" aria-live="polite"><div className="td-travel-card"><div className="td-travel-path" aria-hidden="true"><i/><span>⛵</span><b>{mission.icon}</b></div><div className="mx-auto w-24"><Detective state="thinking"/></div><p>{lang === "bn" ? `${mission.place.bn}-এর পথে…` : `Travelling to ${mission.place.en}…`}</p></div></div>;
}

function MapScreen({ lang, completed, stars, muted, onToggleSound, onOpen, onFinal }: { lang: "en" | "bn"; completed: Set<MissionId>; stars: number; muted: boolean; onToggleSound: () => void; onOpen: (id: MissionId) => void; onFinal: () => void }) {
  return <div className="td-game-shell relative overflow-hidden rounded-[2rem] border-4 border-game-paper shadow-game">
    <div className="td-cloudscape" aria-hidden="true"><span/><span/><span/></div>
    <WeatherFriends />
    <div className="absolute right-3 top-3 z-30"><SoundToggle muted={muted} lang={lang} onToggle={onToggleSound}/></div>
    <div className="relative z-20 px-4 pt-6 text-center sm:px-8 sm:pt-8">
      <p className="td-kicker">{lang === "bn" ? "ছোট্ট গোয়েন্দার বাংলাদেশ অভিযান" : "A LITTLE DETECTIVE'S BANGLADESH ADVENTURE"}</p>
      <h2 className="td-game-title">{lang === "bn" ? "আমার হাতে বাংলাদেশ" : "Bangladesh in My Hands"}</h2>
      <p className="td-game-subtitle">{lang === "bn" ? "ছবি দেখো • পরিবর্তন খোঁজো • সূত্র জেতো" : "Look closely • Spot changes • Win clues"}</p>
    </div>
    <div className="td-adventure-map relative z-10 mx-auto mt-4 min-h-[650px] max-w-4xl sm:min-h-[620px]">
      <div className="td-hills" aria-hidden="true"><i/><i/><i/></div>
      <svg viewBox="0 0 760 560" className="td-route" aria-hidden="true"><path d="M180 92C420 112 512 173 520 241S212 291 211 374s237 63 353 123"/><path className="td-route-progress" pathLength="4" strokeDasharray={`${completed.size} 4`} d="M180 92C420 112 512 173 520 241S212 291 211 374s237 63 353 123"/></svg>
      {MISSIONS.map((mission, i) => {
        const positions = ["td-stop-one", "td-stop-two", "td-stop-three", "td-stop-four"];
        const done = completed.has(mission.id);
        const next = i === completed.size;
        return <Button key={mission.id} type="button" onClick={() => onOpen(mission.id)} className={`td-map-pin ${positions[i]} ${done ? "td-stop-done" : ""} ${next ? "td-stop-next" : ""}`}>
          <span className="td-pin-number">{done ? <Check/> : mission.number}</span><span className="td-pin-icon" aria-hidden="true">{mission.icon}</span><span className="td-pin-copy">{mission.place[lang]}</span>
        </Button>;
      })}
      <div className="td-river" aria-hidden="true"><span className="td-mini-boat">⛵</span></div>
      <div className="td-real-map"><BangladeshDistrictMap/><span>{lang === "bn" ? "৬৪ জেলা" : "64 districts"}</span></div>
      <div className="td-map-detective"><Detective /></div>
      <div className="td-map-flora td-flora-left" aria-hidden="true">♒</div><div className="td-map-flora td-flora-right" aria-hidden="true">♧</div>
    </div>
    <div className="td-game-hud relative z-20">
      <div className="td-progress"><div className="td-progress-top"><span><Star className="fill-current"/> {stars} {lang === "bn" ? "তারা" : "Stars"}</span><b>{completed.size}/4</b></div><div className="td-progress-track"><i style={{ width: `${completed.size * 25}%` }}/></div></div>
      <Button type="button" size="lg" disabled={completed.size < MISSIONS.length} onClick={onFinal} className="td-final-button">{completed.size < MISSIONS.length ? <><LockKeyhole/> {lang === "bn" ? "সব সূত্র খুঁজে নাও" : "Find every clue"}</> : <><Search/> {lang === "bn" ? "শেষ রহস্য সমাধান" : "Solve final mystery"}</>}</Button>
    </div>
    <p className="td-honesty">ⓘ {lang === "bn" ? "ছবিগুলো পর্যবেক্ষণ অনুশীলনের জন্য—বাস্তব ঐতিহাসিক তথ্য নয়।" : "Illustrations teach observation — they are not real historical data."}</p>
  </div>;
}

function MissionScore({ stars, lang, pulse }: { stars: number; lang: "en" | "bn"; pulse: boolean }) {
  return <div className={`td-mission-score ${pulse ? "td-score-bounce" : ""}`} aria-label={lang === "bn" ? `স্কোর ${stars.toLocaleString("bn-BD")} এর মধ্যে ৪` : `Score ${stars} out of 4`}>
    <span>⭐ <b>{stars.toLocaleString(lang === "bn" ? "bn-BD" : "en-US")}/4</b></span>
    <div className="td-score-dots" aria-hidden="true">{Array.from({ length: 4 }).map((_, index) => <i key={index} className={index < stars ? "is-earned" : ""}/>)}</div>
  </div>;
}

function MissionScreen({ mission, lang, completed, stars, muted, onToggleSound, onChime, onBack, onComplete }: { mission: Mission; lang: "en" | "bn"; completed: boolean; stars: number; muted: boolean; onToggleSound: () => void; onChime: () => void; onBack: () => void; onComplete: () => void }) {
  const [feedback, setFeedback] = useState<"idle" | "wrong" | "right">(completed ? "right" : "idle");
  const [scorePulse, setScorePulse] = useState(false);
  const analysis = useMemo(() => analyzeVariable(mission.districtId, mission.variable), [mission.districtId, mission.variable]);
  const dataCorrect = trendFromAnalysis(analysis);
  const answer = (value: Trend | boolean) => {
    const right = typeof value === "boolean" ? value : value === dataCorrect;
    setFeedback(right ? "right" : "wrong");
    if (right) {
      onChime();
      window.setTimeout(() => {
        onComplete();
        setScorePulse(true);
        window.setTimeout(() => setScorePulse(false), 650);
      }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 480);
    }
  };
  return <div className="td-paper td-mission-shell overflow-hidden rounded-[2rem] border-4 border-game-paper shadow-game">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b-4 border-game-ink bg-game-yellow px-3 py-3 sm:px-5"><Button type="button" variant="ghost" onClick={onBack} className="text-game-ink hover:bg-game-paper"><ArrowLeft /> {lang === "bn" ? "মানচিত্র" : "Map"}</Button><p className="font-black text-game-ink">{mission.icon} {lang === "bn" ? `মিশন ${mission.number.toLocaleString("bn-BD")}` : `Mission ${mission.number}`}: {mission.name[lang]}</p><div className="flex items-center gap-1"><SoundToggle muted={muted} lang={lang} onToggle={onToggleSound}/><MissionScore stars={stars} lang={lang} pulse={scorePulse}/></div></div>
    <div className="p-4 sm:p-6">
      <DataWeatherCard mission={mission} analysis={analysis} lang={lang}/>
      <div className="mb-4 rounded-xl border-2 border-dashed border-game-water bg-game-paper/70 px-3 py-2 text-center text-xs font-semibold text-game-muted">ⓘ {lang === "bn" ? "সংখ্যা ও প্রবণতা NASA রেকর্ড থেকে; দৃশ্যটি শুধু শেখার কার্টুন, আজকের লাইভ আবহাওয়া নয়।" : "Numbers and trend use NASA records; the scene is a learning cartoon, not today’s live weather."}</div>
      {mission.id === "village" ? <div className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]"><SceneCard label={lang === "bn" ? "ময়মনসিংহের গ্রাম" : "MYMENSINGH VILLAGE"} kind="village" now trend={dataCorrect} revealed={feedback === "right"}/><div className="rounded-2xl border-4 border-game-ink bg-game-paper p-4 text-game-ink shadow-game"><p className="text-center font-black">{lang === "bn" ? "বাস্তব বার্ষিক রেকর্ড" : "REAL ANNUAL RECORD"}</p><div className="mt-4 space-y-4 text-center text-lg font-black"><p>{analysis?.result.period.start} → {analysis?.result.first_value?.toFixed(1)} {analysis?.unit}</p><p>{analysis?.result.period.end} → {analysis?.result.current_value?.toFixed(1)} {analysis?.unit}</p><p className="text-3xl">{TREND_LABELS[dataCorrect].icon}</p></div></div></div> : <div className="grid gap-4 sm:grid-cols-2"><SceneCard label={`${lang === "bn" ? "আগে" : "BEFORE"} · ${analysis?.result.period.start ?? "—"}`} kind={mission.id} now={false} trend={dataCorrect}/><SceneCard label={`${lang === "bn" ? "সাম্প্রতিক" : "RECENT"} · ${analysis?.result.period.end ?? "—"}`} kind={mission.id} now trend={dataCorrect} revealed={feedback === "right"}/></div>}
      <div className="mx-auto mt-6 max-w-2xl text-center"><h3 className="font-display text-2xl text-game-ink">🔎 {lang === "bn" ? `${VARIABLE_NAMES[mission.variable].bn}-এর কী প্রবণতা দেখছ?` : `What trend do you see in ${VARIABLE_NAMES[mission.variable].en.toLowerCase()}?`}</h3>{feedback !== "right" && <div className="mt-4"><TrendChoices lang={lang} onChoose={answer}/></div>}
        {feedback === "wrong" && <div className="td-feedback-wrong mt-4 animate-fade-in rounded-2xl border-2 border-game-red bg-game-paper p-4 font-bold text-game-red" role="status">🤔 {lang === "bn" ? "প্রায় হয়েছে! দুইটি ছবি আবার ভালো করে দেখো।" : "Almost! Look closely at both pictures and try again."}</div>}
        {feedback === "right" && <div className="td-celebrate relative mt-4 overflow-hidden rounded-2xl border-4 border-game-ink bg-game-yellow p-4 text-game-ink shadow-game" role="status"><div className="td-star-flight" aria-hidden="true">★<i/><i/><i/></div><div className="td-mini-star-shower" aria-hidden="true">★ ✦ ★ ✦ ★</div><span className="td-sparkle left-[12%] top-2">✦</span><span className="td-sparkle right-[14%] top-5">★</span><div className="mx-auto w-20"><Detective state="celebrate" /></div><p className="font-display text-2xl">✨ {mission.success[lang]}</p><p className="mt-1 font-black">🔎 {lang === "bn" ? "সূত্র ব্যাজ অর্জিত!" : "Clue Badge earned!"}</p><div className="td-score-earned">⭐ {completed ? (lang === "bn" ? `মোট স্কোর: ${stars.toLocaleString("bn-BD")}/৪` : `Total score: ${stars}/4`) : (lang === "bn" ? "+১ গোয়েন্দা তারা" : "+1 Detective Star")}</div><Button type="button" onClick={onBack} className="mt-3 border-2 border-game-ink bg-game-green text-game-ink shadow-game hover:bg-game-green/80">{lang === "bn" ? "পরের জায়গা বেছে নাও" : "Choose another place"}</Button></div>}
      </div>
    </div>
  </div>;
}

function FinalMission({ lang, onBack, onWin, alreadyWon }: { lang: "en" | "bn"; onBack: () => void; onWin: (newCorrect: number) => void; alreadyWon: boolean }) {
  const [answers, setAnswers] = useState<Partial<Record<MissionId, Trend>>>({});
  const [checked, setChecked] = useState(false);
  const allAnswered = MISSIONS.every((m) => answers[m.id]);
  const realTrend = (mission: Mission) => trendFromAnalysis(analyzeVariable(mission.districtId, mission.variable));
  const correctCount = MISSIONS.filter((mission) => answers[mission.id] === realTrend(mission)).length;
  const check = () => { setChecked(true); if (correctCount === MISSIONS.length) onWin(alreadyWon ? 0 : correctCount); };
  return <div className="td-paper rounded-3xl border-4 border-game-ink p-4 shadow-game sm:p-7"><div className="flex items-center justify-between gap-3"><Button type="button" variant="ghost" onClick={onBack} className="text-game-ink hover:bg-game-paper"><ArrowLeft /> {lang === "bn" ? "মানচিত্র" : "Map"}</Button><span className="rounded-full border-2 border-game-ink bg-game-yellow px-3 py-1 text-xs font-black text-game-ink">🌍 {lang === "bn" ? "চূড়ান্ত মিশন" : "FINAL MISSION"}</span></div>
    <div className="mx-auto mt-2 max-w-2xl text-center"><div className="mx-auto w-28"><Detective state="thinking" /></div><h2 className="font-display text-3xl text-game-ink">{lang === "bn" ? "বাহ! তুমি সব সূত্র সংগ্রহ করেছ।" : "Wow! You collected all the clues."}</h2><p className="mt-2 font-semibold text-game-muted">{lang === "bn" ? "প্রতিটি ছবির প্রবণতা মিলিয়ে বাংলাদেশের রহস্য সমাধান করো।" : "Match each picture clue to its trend and solve the Bangladesh mystery."}</p></div>
    <div className="mx-auto mt-6 grid max-w-3xl gap-3">{MISSIONS.map((mission) => { const district = getDistrict(mission.districtId); const analysis = analyzeVariable(mission.districtId, mission.variable); const correct = realTrend(mission); return <div key={mission.id} className={`rounded-2xl border-2 p-3 ${checked ? answers[mission.id] === correct ? "border-game-green bg-game-green/20" : "border-game-red bg-game-red/10" : "border-game-ink bg-game-paper"}`}><div className="flex items-center gap-3"><span className="text-3xl">{mission.icon}</span><div className="min-w-0 flex-1"><p className="font-black text-game-ink">{lang === "bn" ? district?.bn : district?.name} · {VARIABLE_NAMES[mission.variable][lang]}</p><p className="text-xs font-bold text-game-muted">{analysis?.result.period.start}–{analysis?.result.period.end} · {analysis?.provenance.dataset_id}</p><div className="mt-2 flex flex-wrap gap-2">{(Object.keys(TREND_LABELS) as Trend[]).map((trend) => <Button key={trend} type="button" size="sm" variant={answers[mission.id] === trend ? "default" : "outline"} disabled={checked} onClick={() => setAnswers((old) => ({ ...old, [mission.id]: trend }))} className={`td-pressable ${answers[mission.id] === trend ? "border-2 border-game-ink bg-game-blue text-game-paper" : "border-2 border-game-ink bg-game-paper text-game-ink"}`}>{TREND_LABELS[trend].icon} {TREND_LABELS[trend].label[lang]}</Button>)}</div></div>{checked && answers[mission.id] === correct && <Check className="size-7 text-game-green" />}</div></div>; })}</div>
    <div className="mt-5 text-center">{checked && correctCount < MISSIONS.length && <p className="mb-3 font-bold text-game-red" role="status">{lang === "bn" ? `${correctCount.toLocaleString("bn-BD")}/৪টি ঠিক। ভুলগুলো দেখে আবার চেষ্টা করো!` : `${correctCount}/4 correct. Check the pictures and try again!`}</p>}<Button type="button" size="lg" disabled={!allAnswered} onClick={checked && correctCount < MISSIONS.length ? () => setChecked(false) : check} className="h-12 border-2 border-game-ink bg-game-red px-7 font-black text-game-paper shadow-game">{checked && correctCount < MISSIONS.length ? (lang === "bn" ? "আবার চেষ্টা করো" : "Try again") : (lang === "bn" ? "রহস্য সমাধান করো" : "Solve the mystery")}</Button></div>
  </div>;
}

function AwardScreen({ lang, stars, onRestart }: { lang: "en" | "bn"; stars: number; onRestart: () => void }) {
  return <div className="td-paper td-award relative overflow-hidden rounded-[2rem] border-4 border-game-paper p-6 text-center shadow-game sm:p-10"><div className="td-confetti" aria-hidden="true">★ ✦ ● ★ ✦ ● ★</div><WeatherFriends/><div className="mx-auto w-40"><Detective state="celebrate" /></div><div className="mx-auto mt-2 inline-flex size-28 items-center justify-center rounded-full border-4 border-game-ink bg-game-yellow text-6xl shadow-game">🏆</div><h2 className="mt-4 td-game-title text-3xl sm:text-5xl">{lang === "bn" ? "অভিনন্দন, ছোট্ট গোয়েন্দা!" : "Congratulations, little detective!"}</h2><p className="mx-auto mt-3 max-w-xl text-lg font-bold text-game-muted">🌍🔎 {lang === "bn" ? "তুমি ছবি দেখে পরিবর্তন খুঁজে বাংলাদেশের সব রহস্য সমাধান করেছ!" : "You observed changes and solved every Bangladesh mystery!"}</p><div className="mx-auto mt-5 max-w-md rounded-2xl border-4 border-game-ink bg-game-blue p-5 text-game-paper shadow-game"><p className="text-xs font-black uppercase">{lang === "bn" ? "তোমার নতুন ব্যাজ" : "Your new badge"}</p><p className="mt-1 text-2xl font-black">🇧🇩 {lang === "bn" ? "আমার হাতে বাংলাদেশ" : "Bangladesh in My Hands"}</p><p className="mt-2 font-black">⭐ {stars} {lang === "bn" ? "গোয়েন্দা তারা" : "Detective Stars"}</p></div><p className="mt-6 text-xl font-black text-game-ink">🇧🇩 “{lang === "bn" ? "দেখো। ভাবো। পরিবর্তন খোঁজো।" : "Look. Think. Find the change."}”</p><Button type="button" size="lg" onClick={onRestart} className="td-pressable mt-5 border-2 border-game-ink bg-game-green font-black text-game-ink shadow-game hover:bg-game-green/80"><RotateCcw /> {lang === "bn" ? "আবার অভিযান শুরু করো" : "Play again"}</Button></div>;
}

export function TrendDetectiveGame() {
  const { lang } = useLang();
  const [screen, setScreen] = useState<Screen>("map");
  const [completed, setCompleted] = useState<Set<MissionId>>(new Set());
  const [stars, setStars] = useState(0);
  const [won, setWon] = useState(false);
  const [muted, setMuted] = useState(false);
  const [travel, setTravel] = useState<{ to: Screen; mission: Mission } | null>(null);
  const activeMission = useMemo(() => MISSIONS.find((m) => m.id === screen), [screen]);
  useEffect(() => {
    if (!travel) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => { setScreen(travel.to); setTravel(null); }, reduced ? 10 : 800);
    return () => window.clearTimeout(timer);
  }, [travel]);
  const navigateWithTravel = (to: Screen, mission: Mission) => setTravel({ to, mission });
  const chime = () => {
    if (muted || typeof window === "undefined") return;
    const AudioContextCtor = window.AudioContext;
    const context = new AudioContextCtor();
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.42);
    gain.connect(context.destination);
    [659, 988].forEach((frequency, index) => { const oscillator = context.createOscillator(); oscillator.type = "sine"; oscillator.frequency.value = frequency; oscillator.connect(gain); oscillator.start(context.currentTime + index * 0.09); oscillator.stop(context.currentTime + 0.3 + index * 0.09); });
    window.setTimeout(() => void context.close(), 650);
  };
  const complete = (id: MissionId) => { if (!completed.has(id)) { setCompleted((old) => new Set(old).add(id)); setStars((s) => s + 1); } };
  const restart = () => { setCompleted(new Set()); setStars(0); setWon(false); setScreen("map"); };
  let content = null;
  if (screen === "map") content = <MapScreen lang={lang} completed={completed} stars={stars} muted={muted} onToggleSound={() => setMuted((value) => !value)} onOpen={(id) => { const mission = MISSIONS.find((item) => item.id === id); if (mission) navigateWithTravel(id, mission); }} onFinal={() => setScreen("final")}/>;
  else if (screen === "final") content = <FinalMission lang={lang} alreadyWon={won} onBack={() => setScreen("map")} onWin={(bonus) => { setStars((s) => s + bonus); setWon(true); setScreen("award"); }}/>;
  else if (screen === "award") content = <AwardScreen lang={lang} stars={stars} onRestart={restart}/>;
  else if (activeMission) content = <MissionScreen mission={activeMission} lang={lang} completed={completed.has(activeMission.id)} stars={stars} muted={muted} onToggleSound={() => setMuted((value) => !value)} onChime={chime} onBack={() => navigateWithTravel("map", activeMission)} onComplete={() => complete(activeMission.id)}/>;
  return <div className="relative">{content}{travel && <TravelTransition mission={travel.mission} lang={lang}/>}</div>;
}