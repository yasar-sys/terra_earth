/**
 * Deterministic biome-trend classifier.
 *
 * The label is decided purely by the Mann-Kendall significance and Theil-Sen
 * slope signs of NDVI, temperature and precipitation. No model or LLM is
 * involved; the same inputs always produce the same label and explanation.
 */
import { analyzeVariable, type VariableKey } from "@/lib/climate";
import type { TrendResult } from "@/lib/stats";

export type BiomeClass = "stable" | "greening" | "drying" | "warming" | "wetwarm" | "unknown";

export interface BiomeVerdict {
  label: BiomeClass;
  labelKey: string;
  inputs: {
    variable: VariableKey;
    direction: TrendResult["trend"]["direction"];
    significant: boolean;
    perDecade: number;
    pValue: number;
    unit: string;
  }[];
  explanation: { en: string; bn: string };
}

type Dir = "up" | "down" | "flat";

function dirOf(r: TrendResult | null): Dir {
  if (!r || !r.trend.significant_at_0_05) return "flat";
  return r.slope.slope_per_year > 0 ? "up" : "down";
}

export function classifyBiome(districtId: string): BiomeVerdict {
  const vegKey: VariableKey = "ndvi";
  const veg = analyzeVariable(districtId, vegKey);
  const tempSource = analyzeVariable(districtId, "lst") ?? analyzeVariable(districtId, "temperature");
  const rain = analyzeVariable(districtId, "precipitation");

  const inputs = [veg, tempSource, rain]
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .map((x) => ({
      variable: x.variable,
      direction: x.result.trend.direction,
      significant: x.result.trend.significant_at_0_05,
      perDecade: x.result.slope.slope_per_decade,
      pValue: x.result.trend.p_value,
      unit: x.unit,
    }));

  const v = dirOf(veg?.result ?? null);
  const t = dirOf(tempSource?.result ?? null);
  const r = dirOf(rain?.result ?? null);

  if (!tempSource && !veg) {
    return {
      label: "unknown",
      labelKey: "district.nodata",
      inputs,
      explanation: {
        en: "Not enough cached variables to classify this district's biome trend yet.",
        bn: "এই জেলার বায়োম প্রবণতা নির্ধারণ করার জন্য এখনও পর্যাপ্ত সংরক্ষিত উপাত্ত নেই।",
      },
    };
  }

  let label: BiomeClass;
  if (v === "down" && (t === "up" || r === "down")) label = "drying";
  else if (v === "down") label = "drying";
  else if (v === "up" && t === "up" && r === "up") label = "wetwarm";
  else if (v === "up") label = "greening";
  else if (t === "up" && r === "down") label = "warming";
  else if (t === "up") label = "warming";
  else label = "stable";

  const labelKey = `biome.${label === "wetwarm" ? "wetwarm" : label}`;

  const describe = (lang: "en" | "bn") => {
    const part = (name: { en: string; bn: string }, d: Dir, x: (typeof inputs)[number] | undefined) => {
      if (!x) return lang === "en" ? `${name.en} has no cached series` : `${name.bn}-এর সংরক্ষিত সারি নেই`;
      const rate = `${x.perDecade > 0 ? "+" : ""}${x.perDecade.toFixed(3)} ${x.unit}/decade`;
      if (lang === "en") {
        return d === "flat"
          ? `${name.en} shows no statistically significant change (p = ${x.pValue.toFixed(3)})`
          : `${name.en} is ${d === "up" ? "rising" : "falling"} at ${rate} (p = ${x.pValue.toFixed(3)})`;
      }
      return d === "flat"
        ? `${name.bn}-এ পরিসংখ্যানগতভাবে তাৎপর্যপূর্ণ পরিবর্তন নেই (p = ${x.pValue.toFixed(3)})`
        : `${name.bn} ${d === "up" ? "বাড়ছে" : "কমছে"} — ${rate} (p = ${x.pValue.toFixed(3)})`;
    };

    const vegPart = part({ en: "Vegetation (NDVI)", bn: "সবুজতা (NDVI)" }, v, inputs.find((i) => i.variable === "ndvi"));
    const tempPart = part(
      { en: "Temperature", bn: "তাপমাত্রা" },
      t,
      inputs.find((i) => i.variable === "lst" || i.variable === "temperature"),
    );
    const rainPart = part({ en: "Rainfall", bn: "বৃষ্টিপাত" }, r, inputs.find((i) => i.variable === "precipitation"));

    const verdict: Record<BiomeClass, { en: string; bn: string }> = {
      stable: {
        en: "Taken together, none of the three signals moves far enough or consistently enough to call this a changing biome, so the classifier returns Stable.",
        bn: "একত্রে বিচারে তিনটি সংকেতের কোনোটিই যথেষ্ট ধারাবাহিকভাবে বদলায়নি, তাই শ্রেণিবিন্যাসটি স্থিতিশীল।",
      },
      greening: {
        en: "Because vegetation is significantly increasing while temperature and rainfall do not both push in the stress direction, the classifier returns Greening.",
        bn: "সবুজতা তাৎপর্যপূর্ণভাবে বাড়ছে অথচ তাপমাত্রা ও বৃষ্টিপাত দুটোই চাপের দিকে যাচ্ছে না, তাই শ্রেণিবিন্যাস সবুজায়ন।",
      },
      drying: {
        en: "Falling vegetation is the dominant signal here, which the classifier reads as Drying / vegetation loss regardless of the other two directions.",
        bn: "সবুজতা কমে যাওয়াই এখানে প্রধান সংকেত, তাই শ্রেণিবিন্যাস শুষ্কতা / সবুজ হ্রাস।",
      },
      warming: {
        en: "Vegetation is not significantly changing but temperature is significantly rising, so the classifier returns Warming stress.",
        bn: "সবুজতায় তাৎপর্যপূর্ণ পরিবর্তন নেই, কিন্তু তাপমাত্রা তাৎপর্যপূর্ণভাবে বাড়ছে, তাই শ্রেণিবিন্যাস উষ্ণতার চাপ।",
      },
      wetwarm: {
        en: "All three signals rise together — greener, hotter and wetter — so the classifier returns Warming and wetter rather than simple greening.",
        bn: "তিনটি সংকেতই একসাথে বাড়ছে — সবুজতর, উষ্ণতর ও আর্দ্রতর — তাই শ্রেণিবিন্যাস উষ্ণ ও আর্দ্রতর।",
      },
      unknown: { en: "", bn: "" },
    };

    return `${vegPart}. ${tempPart}. ${rainPart}. ${verdict[label][lang]}`;
  };

  return {
    label,
    labelKey,
    inputs,
    explanation: { en: describe("en"), bn: describe("bn") },
  };
}
