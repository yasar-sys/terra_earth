import { createFileRoute } from "@tanstack/react-router";
import { coveredDistrictIds, districts } from "@/lib/climate";
import { useLang } from "@/lib/i18n";

const DATASETS = [
  {
    id: "NASA_POWER_MONTHLY_AG_V9",
    name: "NASA POWER (monthly, agroclimatology)",
    vars: "Air temperature (T2M), all-sky solar radiation, corrected precipitation",
    url: "https://power.larc.nasa.gov/",
  },
  {
    id: "MOD13Q1.061",
    name: "MODIS Terra Vegetation Indices 16-day 250 m",
    vars: "NDVI",
    url: "https://modis.ornl.gov/data/modis_webservice.html",
  },
  {
    id: "MOD11A2.061",
    name: "MODIS Terra Land Surface Temperature 8-day 1 km",
    vars: "Daytime land surface temperature",
    url: "https://modis.ornl.gov/data/modis_webservice.html",
  },
  {
    id: "geoBoundaries gbOpen BGD ADM2",
    name: "Bangladesh district boundaries (CC BY 3.0 IGO)",
    vars: "64 district polygons",
    url: "https://www.geoboundaries.org/",
  },
];

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Data & methods — Terra Earth" },
      {
        name: "description",
        content:
          "Every dataset, statistic and honesty rule behind the worldwide Terra Earth explorer: Mann-Kendall, Theil-Sen, offline caches and provenance.",
      },
      { property: "og:title", content: "Data & methods — Terra Earth" },
      {
        property: "og:description",
        content: "Mann-Kendall, Theil-Sen, cached NASA sources and the no-fabricated-data rule.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { t, lang } = useLang();
  const covered = coveredDistrictIds().length;

  return (
    <div className="mx-auto max-w-4xl px-3 py-8 sm:px-6">
      <h1 className="font-display text-3xl text-foreground">{t("nav.about")}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {lang === "bn"
          ? "প্রতিটি সংখ্যা সংরক্ষিত নাসা উপাত্ত থেকে গণনা করা হয়। প্রবণতা পরীক্ষা Mann-Kendall এবং ঢাল Theil-Sen পদ্ধতিতে নির্ণীত। কোনো সংখ্যা মডেল দিয়ে বানানো হয় না।"
          : "Every number on this site is computed from cached NASA observations. Trend significance uses the Mann-Kendall test; the rate of change uses the Theil-Sen estimator. No number is ever produced by a language model, and locations without cached data say so instead of showing estimates."}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        {covered} / {districts.length} locations currently have cached time series.
      </p>

      <p className="mt-3 text-sm text-muted-foreground">{lang === "bn" ? "বিশ্বের দেশ ও শহর অনুসন্ধান করে ২০১৫–২০২৪ NASA রেকর্ড লোড করা যায়। প্রতিটি নমুনা নির্দিষ্ট স্থানাঙ্কের; দেশের গড় নয়। POWER বছরে ১২টি মাস এবং MODIS অন্তত ৮টি পর্যবেক্ষণ চায়।" : "Worldwide country and city searches load NASA records for 2015–2024 at the selected coordinate. Samples are not national averages. POWER annual values require 12 valid months; MODIS annual values require at least 8 valid composites. The original Bangladesh boundaries and caches remain available as regional evidence."}</p>
      <h2 className="mt-8 font-display text-xl text-foreground">Datasets</h2>
      <ul className="mt-3 space-y-3">
        {DATASETS.map((d) => (
          <li key={d.id} className="panel p-4">
            <p className="font-semibold text-foreground">{d.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {d.id} · {d.vars}
            </p>
            <a
              href={d.url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block break-all text-xs text-primary underline"
            >
              {d.url}
            </a>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 font-display text-xl text-foreground">Team</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Terra Earth · NASA Space Apps Challenge 2026, Bangladesh · challenge “Be An Earth
        System Trend Detective!” · Apache-2.0 licensed.
      </p>
    </div>
  );
}
