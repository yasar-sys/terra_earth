import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "en" | "bn";

type Dict = Record<string, { en: string; bn: string }>;

export const strings: Dict = {
  "team.name": { en: "MEC TERRA_DETECTORS", bn: "MEC TERRA_DETECTORS" },
  "app.title": { en: "Terra Earth", bn: "টেরা আর্থ" },
  "app.tagline": {
    en: "Real NASA Earth-observation records, tested for real trends — location by location.",
    bn: "নাসার প্রকৃত পৃথিবী-পর্যবেক্ষণ উপাত্ত, স্থান ধরে ধরে প্রকৃত প্রবণতা পরীক্ষা করা।",
  },
  "nav.globe": { en: "Globe", bn: "গ্লোব" },
  "nav.heatmap": { en: "Heatmap", bn: "হিটম্যাপ" },
  "nav.compare": { en: "Compare", bn: "তুলনা" },
  "nav.kids": { en: "For Kids", bn: "শিশুদের জন্য" },
"nav.about": { en: "Data & Methods", bn: "উপাত্ত ও পদ্ধতি" },
  "nav.how": { en: "How we know", bn: "আমরা যেভাবে জানি" },
  "nav.reference": { en: "Reference", bn: "রেফারেন্স" },
  "nav.chat": { en: "Ask Terra Earth", bn: "টেরা আর্থকে জিজ্ঞেস করুন" },
  "nav.admin": { en: "Admin", bn: "অ্যাডমিন" },
  "nav.menu": { en: "Open navigation", bn: "নেভিগেশন খুলুন" },
  "nav.skip": { en: "Skip to main content", bn: "মূল অংশে যান" },
  "lang.toggle": { en: "বাংলা", bn: "English" },
  "lang.label": { en: "Switch language to Bangla", bn: "ভাষা ইংরেজিতে বদলান" },
  "hero.cta": { en: "Select any point on Earth", bn: "গ্লোবে পৃথিবীে ক্লিক করুন" },
  "hero.enter": { en: "Explore Earth", bn: "পৃথিবীে প্রবেশ করুন" },
  "hero.challenge": {
    en: "NASA Space Apps Challenge 2026 · Be An Earth System Trend Detective!",
    bn: "নাসা স্পেস অ্যাপস চ্যালেঞ্জ ২০২৬ · Be An Earth System Trend Detective!",
  },
  "globe.loading": { en: "Loading globe…", bn: "গ্লোব লোড হচ্ছে…" },
  "globe.districts": { en: "locations with cached NASA records", bn: "স্থানে সংরক্ষিত নাসা উপাত্ত" },
  "globe.back": { en: "Back to world view", bn: "বিশ্ব দৃশ্যে ফিরুন" },
  "globe.pick": { en: "Select a location", bn: "একটি স্থান বেছে নিন" },
  "globe.search": { en: "Search locations", bn: "স্থান খুঁজুন" },
  "district.overview": { en: "Location overview", bn: "স্থান সারসংক্ষেপ" },
  "district.nodata": {
    en: "Data not yet available for this location",
    bn: "এই স্থানের উপাত্ত এখনও পাওয়া যায়নি",
  },
  "district.nodata.detail": {
    en: "No cached NASA time series has been added for this location yet. We do not show estimated or filled-in numbers.",
    bn: "এই স্থানের জন্য এখনও কোনো সংরক্ষিত নাসা সময়-সারি যোগ করা হয়নি। আমরা অনুমাননির্ভর সংখ্যা দেখাই না।",
  },
  "var.ndvi": { en: "Vegetation (NDVI)", bn: "সবুজতা (NDVI)" },
  "var.lst": { en: "Land surface temperature", bn: "ভূ-পৃষ্ঠের তাপমাত্রা" },
  "var.temperature": { en: "Air temperature", bn: "বায়ুর তাপমাত্রা" },
  "var.solar": { en: "Solar radiation", bn: "সৌর বিকিরণ" },
  "var.precipitation": { en: "Precipitation", bn: "বৃষ্টিপাত" },
  "card.current": { en: "Current value", bn: "বর্তমান মান" },
  "card.rate": { en: "Rate of change", bn: "পরিবর্তনের হার" },
  "card.perDecade": { en: "per decade", bn: "প্রতি দশকে" },
  "card.pvalue": { en: "p-value", bn: "p-মান" },
  "card.observations": { en: "years of data", bn: "বছরের উপাত্ত" },
  "badge.significant": { en: "Significant", bn: "তাৎপর্যপূর্ণ" },
  "badge.notSignificant": { en: "Not significant", bn: "তাৎপর্যপূর্ণ নয়" },
  "badge.rising": { en: "Rising", bn: "বাড়ছে" },
  "badge.falling": { en: "Falling", bn: "কমছে" },
  "badge.flat": { en: "No clear trend", bn: "স্পষ্ট প্রবণতা নেই" },
  "biome.title": { en: "Biome trend", bn: "বায়োম প্রবণতা" },
  "biome.stable": { en: "Stable", bn: "স্থিতিশীল" },
  "biome.greening": { en: "Greening", bn: "সবুজায়ন" },
  "biome.drying": { en: "Drying / vegetation loss", bn: "শুষ্কতা / সবুজ হ্রাস" },
  "biome.warming": { en: "Warming stress", bn: "উষ্ণতার চাপ" },
  "biome.wetwarm": { en: "Warming and wetter", bn: "উষ্ণ ও আর্দ্রতর" },
  "prov.open": { en: "Provenance", bn: "উৎস" },
  "prov.title": { en: "Where this number comes from", bn: "এই সংখ্যাটি কোথা থেকে এসেছে" },
  "prov.close": { en: "Close", bn: "বন্ধ করুন" },
  "prov.dataset": { en: "Dataset", bn: "ডেটাসেট" },
  "prov.retrieved": { en: "Retrieved", bn: "সংগ্রহের সময়" },
  "prov.mode": { en: "Mode", bn: "মোড" },
  "prov.raw": { en: "Raw response JSON", bn: "কাঁচা JSON" },
  "footer.built": {
    en: "Built by MEC TERRA_DETECTORS for NASA Space Apps Challenge 2026, Earth.",
    bn: "নাসা স্পেস অ্যাপস চ্যালেঞ্জ ২০২৬, পৃথিবীের জন্য MEC TERRA_DETECTORS নির্মিত।",
  },
  "footer.license": { en: "Apache-2.0 licensed · offline-first", bn: "Apache-2.0 লাইসেন্স · অফলাইন-প্রথম" },
  "compare.title": { en: "Compare trends", bn: "প্রবণতা তুলনা" },
  "compare.start": { en: "Start year", bn: "শুরুর বছর" },
  "compare.end": { en: "End year", bn: "শেষ বছর" },
  "compare.mode.districts": { en: "Two locations, one variable", bn: "দুই স্থান, এক সূচক" },
  "compare.mode.variables": { en: "One location, two variables", bn: "এক স্থান, দুই সূচক" },
  "compare.export": { en: "Download PDF", bn: "PDF ডাউনলোড" },
  "compare.exporting": { en: "Building report…", bn: "রিপোর্ট তৈরি হচ্ছে…" },
  "compare.report": { en: "Comparison report", bn: "তুলনা প্রতিবেদন" },
  "heatmap.title": { en: "Gridded heatmap", bn: "গ্রিড হিটম্যাপ" },
  "kids.title": { en: "Climate Learning Studio", bn: "জলবায়ু শেখার স্টুডিও" },
  "reference.title": { en: "Reference, Research & Documentation", bn: "রেফারেন্স, গবেষণা ও ডকুমেন্টেশন" },
  "reference.nasa_apps": { en: "NASA Space Apps Relationship", bn: "নাসা স্পেস অ্যাপসের সাথে সম্পর্ক" },
  "reference.research_links": { en: "Research & Documentation", bn: "গবেষণা ও নথি" },
  "reference.video_preview": { en: "Video Preview", bn: "ভিডিও প্রিভিউ" },
  "loading": { en: "Loading…", bn: "লোড হচ্ছে…" },
};

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<Ctx>({
  lang: "en",
  setLang: () => {},
  t: (key) => strings[key]?.en ?? key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem("mec-lang");
    if (stored === "bn" || stored === "en") setLangState(stored);
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    window.localStorage.setItem("mec-lang", next);
    document.documentElement.lang = next;
  }, []);

  const t = useCallback(
    (key: string) => {
      const entry = strings[key];
      if (!entry) return key;
      return lang === "bn" ? entry.bn : entry.en;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  return useContext(LanguageContext);
}

/** Format a number with Bangla digits when the Bangla locale is active. */
export function fmt(value: number, lang: Lang, digits = 2) {
  return value.toLocaleString(lang === "bn" ? "bn-BD" : "en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
