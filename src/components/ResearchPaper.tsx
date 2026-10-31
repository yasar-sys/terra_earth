import { Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";

type L = (en: string, bn: string) => string;

const REFS = [
  "Gelaro, R., et al. (2017). The Modern-Era Retrospective Analysis for Research and Applications, Version 2 (MERRA-2). Journal of Climate, 30(14), 5419–5454. https://doi.org/10.1175/JCLI-D-16-0758.1",
  "Stackhouse, P. W., et al. NASA Prediction Of Worldwide Energy Resources (POWER) Project, Data Access Viewer and API. NASA Langley Research Center. https://power.larc.nasa.gov",
  "Huffman, G. J., et al. (2019). GPM IMERG Final Precipitation L3, V06. NASA GES DISC. https://doi.org/10.5067/GPM/IMERG/3B-HH/06",
  "Didan, K. (2021). MODIS/Terra Vegetation Indices 16-Day L3 Global 250m (MOD13Q1 v061). NASA EOSDIS LP DAAC. https://doi.org/10.5067/MODIS/MOD13Q1.061",
  "Wan, Z., Hook, S., & Hulley, G. (2021). MODIS/Terra Land Surface Temperature/Emissivity 8-Day L3 Global 1km (MOD11A2 v061). NASA EOSDIS LP DAAC. https://doi.org/10.5067/MODIS/MOD11A2.061",
  "Randles, C. A., et al. (2017). The MERRA-2 Aerosol Reanalysis, 1980 Onward. Journal of Climate, 30(17), 6823–6850. https://doi.org/10.1175/JCLI-D-16-0609.1",
  "Mann, H. B. (1945). Nonparametric tests against trend. Econometrica, 13(3), 245–259. https://doi.org/10.2307/1907187",
  "Kendall, M. G. (1975). Rank Correlation Methods (4th ed.). Charles Griffin, London.",
  "Sen, P. K. (1968). Estimates of the regression coefficient based on Kendall's tau. Journal of the American Statistical Association, 63(324), 1379–1389. https://doi.org/10.1080/01621459.1968.10480934",
  "Rantanen, M., et al. (2022). The Arctic has warmed nearly four times faster than the globe since 1979. Communications Earth & Environment, 3, 168. https://doi.org/10.1038/s43247-022-00498-3",
  "NASA Space Apps Challenge (2026). Be an Earth System Trend Detective! https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/",
];

function H({ n, children }: { n: string; children: React.ReactNode }) {
  return <h3 className="mt-8 font-display text-xl text-foreground">{n}. {children}</h3>;
}

export function ResearchPaper({ L }: { L: L }) {
  const p = "mt-3 text-sm leading-7 text-muted-foreground";
  return (
    <section id="research-paper" className="mt-12 border-t border-border pt-8" aria-labelledby="paper-title">
      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase text-accent">
        <FileText className="h-4 w-4" aria-hidden /> {L("Research paper", "গবেষণাপত্র")}
      </p>
      <article className="mt-4 rounded-xl border border-border bg-card/70 p-5 sm:p-8">
        <header className="border-b border-border pb-5 text-center">
          <h2 id="paper-title" className="font-display text-2xl leading-tight text-foreground sm:text-3xl">
            Terra Earth: An Open, Evidence-Led Tool for Detecting Long-Term Earth-System Trends from NASA Observations
          </h2>
          <p className="mt-3 text-sm text-foreground">MEC Terra_Detectors · NASA Space Apps Challenge 2026</p>
          <p className="mt-1 text-xs text-muted-foreground">{L("Working paper — figures are reproducible live in the app", "ওয়ার্কিং পেপার — সব ফলাফল অ্যাপে সরাসরি পুনরুৎপাদনযোগ্য")}</p>
        </header>

        <h3 className="mt-6 font-display text-lg text-foreground">{L("Abstract", "সারসংক্ষেপ")}</h3>
        <p className={p}>
          {L(
            "Long-term environmental change is measured by NASA satellites and reanalyses, yet these records are hard for students, communities and decision-makers to query. We present Terra Earth, a bilingual (English/Bangla) web tool that lets any user choose a place anywhere on Earth, a variable, a season and a range of years, and then tests whether a statistically significant trend exists. Monthly records from NASA POWER (MERRA-2, GPM IMERG-corrected precipitation, CERES) and MODIS are reduced to seasonal series, tested with the Mann-Kendall test and quantified with Sen's slope. State- and country-wide questions are answered with sampled averages of up to 24 grid points inside official boundaries. Worked examples show significant warming of about 0.80 °C per decade at Svalbard since 1982 and a significant rise in Sahel rainy-season root-zone soil wetness. Every number carries its source, and missing data are shown as missing rather than estimated.",
            "নাসার স্যাটেলাইট ও রিঅ্যানালাইসিস দীর্ঘমেয়াদি পরিবেশগত পরিবর্তন মাপে, কিন্তু সাধারণ মানুষের পক্ষে এই তথ্য খোঁজা কঠিন। টেরা আর্থ একটি দ্বিভাষিক ওয়েব টুল, যেখানে বিশ্বের যেকোনো স্থান, চলক, ঋতু ও বছরের পরিসর বেছে নিয়ে পরিসংখ্যানগতভাবে তাৎপর্যপূর্ণ প্রবণতা আছে কি না পরীক্ষা করা যায়। NASA POWER ও MODIS-এর মাসিক তথ্যকে ঋতুভিত্তিক সিরিজে রূপান্তর করে Mann-Kendall পরীক্ষা ও Sen's slope প্রয়োগ করা হয়। দেশ/রাজ্যভিত্তিক প্রশ্নে সীমানার ভেতরের সর্বোচ্চ ২৪টি বিন্দুর গড় নেওয়া হয়। উদাহরণে দেখা যায় স্বালবার্ডে ১৯৮২ থেকে প্রতি দশকে প্রায় ০.৮০ °C তাৎপর্যপূর্ণ উষ্ণায়ন এবং সাহেলে বর্ষাকালীন মাটির আর্দ্রতার তাৎপর্যপূর্ণ বৃদ্ধি। প্রতিটি সংখ্যার উৎস দেখানো হয় এবং অনুপস্থিত তথ্য অনুমান করা হয় না।",
          )}
        </p>
        <p className="mt-3 text-xs text-muted-foreground"><strong className="text-foreground">{L("Keywords", "মূলশব্দ")}:</strong> climate trends; NASA POWER; MERRA-2; MODIS; Mann-Kendall; Sen's slope; open science; climate education</p>

        <H n="1">{L("Introduction", "ভূমিকা")}</H>
        <p className={p}>Questions such as "Is July getting hotter where I live?" or "Is smoke haze increasing?" require decades of consistent observations and a statistical test that separates trend from year-to-year noise. NASA provides such records, but access usually requires programming and knowledge of file formats. The 2026 NASA Space Apps challenge "Be an Earth System Trend Detective!" asks teams to make these trends discoverable. Our objectives were: (i) worldwide place selection; (ii) multiple Earth-system variables across the atmosphere, water cycle, land and air quality; (iii) a transparent significance test; and (iv) honest communication of uncertainty and data gaps, including for children.</p>

        <H n="2">{L("Data", "তথ্য")}</H>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-xs">
            <caption className="mb-2 text-left text-muted-foreground">Table 1. Variables and NASA sources used.</caption>
            <thead className="border-b border-border text-foreground"><tr><th className="py-2 pr-3">Variable</th><th className="pr-3">Unit</th><th>Source</th></tr></thead>
            <tbody className="text-muted-foreground">
              {[
                ["Air temperature / daily maximum (2 m)", "°C", "MERRA-2 via NASA POWER, 1981–2024"],
                ["Precipitation", "mm/day", "MERRA-2 bias-corrected with GPM IMERG"],
                ["Relative humidity, wind (2 m)", "%, m/s", "MERRA-2 via NASA POWER"],
                ["Root-zone soil wetness", "0–1", "MERRA-2 land model"],
                ["Surface sunlight", "kWh/m²/day", "CERES / GEWEX via NASA POWER"],
                ["Aerosol optical depth (550 nm)", "—", "MERRA-2 aerosol reanalysis"],
                ["Total column ozone", "DU", "CERES SYN1deg via NASA POWER"],
                ["Vegetation (NDVI), land surface temperature", "—, °C", "MODIS MOD13Q1, MOD11A2"],
              ].map((r) => <tr key={r[0]} className="border-b border-border/60"><td className="py-2 pr-3">{r[0]}</td><td className="pr-3">{r[1]}</td><td>{r[2]}</td></tr>)}
            </tbody>
          </table>
        </div>

        <H n="3">{L("Methods", "পদ্ধতি")}</H>
        <p className={p}><strong className="text-foreground">3.1 Seasonal series.</strong> For each year, monthly values in the selected season (a single month, DJF, MAM, JJA, SON or the full year) are averaged. A year is used only when every month of the season is present; incomplete years are excluded rather than filled.</p>
        <p className={p}><strong className="text-foreground">3.2 Trend test.</strong> The non-parametric Mann-Kendall test detects monotonic change without assuming normality; a trend is reported as significant when p &lt; 0.05. Magnitude is expressed per decade using Sen's slope, which is robust to outliers.</p>
        <p className={p}><strong className="text-foreground">3.3 Regional averages.</strong> For a state or country, the official boundary is retrieved and up to 24 evenly spaced points inside it are sampled; their annual series are averaged. This is labelled a sampled average, not an official national statistic. Single locations are always presented as point observations, never as national averages.</p>
        <p className={p}><strong className="text-foreground">3.4 Grounded explanations.</strong> AI-written explanations are generated only from statistics the server recomputes from cached NASA records; the browser sends selections, never values.</p>

        <H n="4">{L("Results", "ফলাফল")}</H>
        <p className={p}>Two worked cases were run end-to-end with live NASA data. (a) <em>Longyearbyen, Svalbard</em>, annual mean air temperature: a significant warming trend of about 0.80 °C per decade since 1982, consistent with the rapid Arctic warming reported by Rantanen et al. (2022). (b) <em>Niamey, Niger (Sahel)</em>, June–August root-zone soil wetness: a significant increasing trend, consistent with partial recovery of Sahel rainfall after the 1980s drought. Further cases (Spain summer heat, Dhaka pre-monsoon heat, Wisconsin smoke haze, Antarctic October ozone, Amazon dry-season rain) can be reproduced live on the <Link to="/detective" className="text-primary underline">Trend Detective</Link> page; exact values depend on the latest NASA data release.</p>

        <H n="5">{L("Discussion", "আলোচনা")}</H>
        <p className={p}>Changing the window matters: shorter seasons or periods are noisier, so a trend that is significant for June–August may not be for July alone. Showing this openly teaches that "no significant trend" is different from "no change". Reanalysis products blend models with observations, so local extremes may be smoothed, and grid cells (~0.5°) represent areas rather than a single weather station.</p>

        <H n="6">{L("Limitations", "সীমাবদ্ধতা")}</H>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-7 text-muted-foreground">
          <li>Regional averages sample at most 24 points and are not area-weighted grids.</li>
          <li>Ozone comes from CERES SYN1deg via NASA POWER, not raw OMI files.</li>
          <li>Mann-Kendall does not correct for serial autocorrelation; p-values may be optimistic.</li>
          <li>Trends describe change, not cause; attribution needs further study.</li>
        </ul>

        <H n="7">{L("Conclusion", "উপসংহার")}</H>
        <p className={p}>Terra Earth shows that decades of NASA Earth observations can be turned into transparent, reproducible trend answers for any place, in two languages, without hiding uncertainty. Future work includes autocorrelation-corrected tests, full gridded regional means and direct OMI and GPM ingestion.</p>

        <H n="8">{L("Data and code availability", "তথ্য ও কোডের প্রাপ্যতা")}</H>
        <p className={p}>All data are openly available from NASA POWER and NASA LP DAAC. Each result in the app shows its dataset, source URL and retrieval time and can be exported as CSV or PDF.</p>

        <h3 className="mt-8 font-display text-xl text-foreground">{L("References", "তথ্যসূত্র")}</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-xs leading-6 text-muted-foreground">
          {REFS.map((r) => <li key={r} className="break-words">{r}</li>)}
        </ol>
      </article>
    </section>
  );
}
