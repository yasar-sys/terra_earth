/**
 * Trend Detective: variable catalog, seasons, guided suggestions and demos.
 * Pure, browser-safe. Every value analysed comes from NASA POWER monthly records.
 */
export const DETECTIVE_VARIABLES = {
  T2M: { label: "Air temperature (2 m)", bn: "বাতাসের তাপমাত্রা (২ মি.)", unit: "°C", source: "MERRA-2 / GEOS via NASA POWER", definition: "How warm the air is about two metres above the ground — roughly where people stand.", bnDef: "মাটি থেকে প্রায় দুই মিটার উপরে বাতাস কতটা গরম।" },
  T2M_MAX: { label: "Daily maximum temperature", bn: "দৈনিক সর্বোচ্চ তাপমাত্রা", unit: "°C", source: "MERRA-2 / GEOS via NASA POWER", definition: "The hottest part of the day, averaged over the month. Useful for heat-stress trends.", bnDef: "দিনের সবচেয়ে গরম সময়ের মাসিক গড়।" },
  PRECTOTCORR: { label: "Precipitation", bn: "বৃষ্টিপাত", unit: "mm/day", source: "MERRA-2 bias-corrected with GPM IMERG via NASA POWER", definition: "Average rain and snow reaching the ground each day.", bnDef: "প্রতিদিন গড়ে কতটা বৃষ্টি বা তুষার মাটিতে পড়ে।" },
  RH2M: { label: "Relative humidity", bn: "আপেক্ষিক আর্দ্রতা", unit: "%", source: "MERRA-2 via NASA POWER", definition: "How close the air is to being saturated with water vapour.", bnDef: "বাতাসে জলীয় বাষ্প কতটা পূর্ণ।" },
  GWETROOT: { label: "Root-zone soil wetness", bn: "শিকড়-স্তরের মাটির আর্দ্রতা", unit: "0–1", source: "MERRA-2 land model via NASA POWER", definition: "How wet the soil is where plant roots live, from 0 (dry) to 1 (saturated).", bnDef: "গাছের শিকড় যেখানে থাকে সেখানে মাটি কতটা ভেজা, ০ (শুকনো) থেকে ১ (পূর্ণ)।" },
  ALLSKY_SFC_SW_DWN: { label: "Sunlight at the surface", bn: "ভূপৃষ্ঠে সূর্যালোক", unit: "kWh/m²/day", source: "CERES / GEWEX via NASA POWER", definition: "Solar energy reaching the ground after clouds and haze — dims when smoke or clouds increase.", bnDef: "মেঘ ও ধোঁয়াশা পেরিয়ে মাটিতে পৌঁছানো সূর্যের শক্তি।" },
  WS2M: { label: "Wind speed (2 m)", bn: "বাতাসের গতি (২ মি.)", unit: "m/s", source: "MERRA-2 via NASA POWER", definition: "Average wind speed near the ground.", bnDef: "মাটির কাছে বাতাসের গড় গতি।" },
} as const;
export type DetectiveVariable = keyof typeof DETECTIVE_VARIABLES;
export const DETECTIVE_VARIABLE_KEYS = Object.keys(DETECTIVE_VARIABLES) as DetectiveVariable[];

export const SEASONS = {
  annual: { label: "Whole year", bn: "পুরো বছর", months: [1,2,3,4,5,6,7,8,9,10,11,12] },
  DJF: { label: "Dec–Feb", bn: "ডিসে–ফেব্রু", months: [12,1,2] },
  MAM: { label: "Mar–May", bn: "মার্চ–মে", months: [3,4,5] },
  JJA: { label: "Jun–Aug", bn: "জুন–আগ", months: [6,7,8] },
  SON: { label: "Sep–Nov", bn: "সেপ্টে–নভে", months: [9,10,11] },
  ...Object.fromEntries(["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m,i)=>[`M${i+1}`,{label:m,bn:m,months:[i+1]}])),
} as Record<string,{label:string;bn:string;months:number[]}>;

export const POWER_FIRST_YEAR = 1981;
export const POWER_LAST_YEAR = 2024;

/**
 * Collapse POWER monthly values ("YYYYMM" → value) into one value per year for a season.
 * A year counts only when every month in the season is a valid record (no fill, no gaps).
 * December of a DJF season belongs to the following year (meteorological convention).
 */
export function seasonalSeries(monthly: Record<string, number>, months: number[], start: number, end: number) {
  const valid = new Map<string, number>();
  for (const [key, v] of Object.entries(monthly)) if (/^\d{6}$/.test(key) && Number.isFinite(v) && v > -900) valid.set(key, v);
  const wraps = months.includes(12) && months.includes(1);
  const out: { year: number; value: number }[] = [];
  for (let year = start; year <= end; year += 1) {
    const vals: number[] = [];
    for (const m of months) {
      const y = wraps && m === 12 ? year - 1 : year;
      const v = valid.get(`${y}${String(m).padStart(2, "0")}`);
      if (v === undefined) break; vals.push(v);
    }
    if (vals.length === months.length) out.push({ year, value: vals.reduce((a, b) => a + b, 0) / vals.length });
  }
  return out;
}

export const ENVIRONMENTS = {
  city: { label: "Big city", bn: "বড় শহর", suggest: ["T2M_MAX","T2M","RH2M"] as DetectiveVariable[], why: "Cities trap heat; daily maxima often reveal heat stress first." },
  desert: { label: "Desert", bn: "মরুভূমি", suggest: ["T2M_MAX","GWETROOT","PRECTOTCORR"] as DetectiveVariable[], why: "Deserts respond through heat extremes and the little soil moisture they hold." },
  rainforest: { label: "Rainforest", bn: "রেইনফরেস্ট", suggest: ["PRECTOTCORR","GWETROOT","T2M"] as DetectiveVariable[], why: "Rainforests depend on steady rain and wet soils; drying shows up there." },
  farmland: { label: "Farmland", bn: "কৃষিজমি", suggest: ["GWETROOT","PRECTOTCORR","T2M_MAX"] as DetectiveVariable[], why: "Crops need root-zone water; soil wetness and rain matter most." },
  coast: { label: "Coast / estuary", bn: "উপকূল", suggest: ["RH2M","PRECTOTCORR","WS2M"] as DetectiveVariable[], why: "Coasts feel humidity, storms and wind changes." },
  polar: { label: "Polar / mountain", bn: "মেরু / পাহাড়", suggest: ["T2M","ALLSKY_SFC_SW_DWN","PRECTOTCORR"] as DetectiveVariable[], why: "Cold regions often warm fastest; sunlight changes with snow and clouds." },
} as const;
export type Environment = keyof typeof ENVIRONMENTS;

export interface DetectiveDemo { id: string; title: string; bn: string; lat: number; lon: number; place: string; variable: DetectiveVariable; season: string; start: number; end: number; story: string }
export const DEMOS: DetectiveDemo[] = [
  { id: "dhaka-heat", title: "Is Dhaka's hot season getting hotter?", bn: "ঢাকার গরমকাল কি আরও গরম হচ্ছে?", lat: 23.8103, lon: 90.4125, place: "Dhaka", variable: "T2M_MAX", season: "MAM", start: 1981, end: 2024, story: "Daily maximum temperature in March–May, the pre-monsoon heat season." },
  { id: "sahel-soil", title: "Is the Sahel's soil drying or recovering?", bn: "সাহেলের মাটি কি শুকাচ্ছে?", lat: 13.5, lon: 2.1, place: "Niamey, Niger", variable: "GWETROOT", season: "JJA", start: 1981, end: 2024, story: "Root-zone soil wetness during the June–August rainy season." },
  { id: "arctic-warm", title: "How fast is the Arctic warming?", bn: "আর্কটিক কত দ্রুত উষ্ণ হচ্ছে?", lat: 78.2232, lon: 15.6267, place: "Longyearbyen, Svalbard", variable: "T2M", season: "annual", start: 1981, end: 2024, story: "Annual mean air temperature at one of the fastest-warming places on Earth." },
  { id: "amazon-rain", title: "Is the Amazon's dry season changing?", bn: "আমাজনের শুষ্ক মৌসুম কি বদলাচ্ছে?", lat: -3.4653, lon: -62.2159, place: "Central Amazon", variable: "PRECTOTCORR", season: "SON", start: 1981, end: 2024, story: "September–November rainfall — the end of the Amazon dry season." },
];

export function trendSentence(opts: { label: string; unit: string; season: string; place: string; direction: "increasing"|"decreasing"|"no trend"; perDecade: number; p: number; n: number }) {
  const rate = `${opts.perDecade >= 0 ? "+" : ""}${opts.perDecade.toFixed(3)} ${opts.unit} per decade`;
  if (opts.direction === "no trend") {
    return `${opts.label} (${opts.season}) at ${opts.place} changed by about ${rate}, but the Mann-Kendall test is not significant (p = ${opts.p.toFixed(3)}, ${opts.n} years). A longer record may be needed before calling it a trend.`;
  }
  return `${opts.label} (${opts.season}) at ${opts.place} shows a statistically significant ${opts.direction} trend of about ${rate} (Mann-Kendall p = ${opts.p.toFixed(3)}, ${opts.n} years).`;
}
