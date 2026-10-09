import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  CloudRain,
  Database,
  Eye,
  Leaf,
  Receipt,
  Ruler,
  Satellite,
  Sun,
  Thermometer,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How we know — Terra Earth" },
      {
        name: "description",
        content:
          "A plain-language guide to how Terra Earth turns NASA satellite records into tested climate trends: NDVI, land temperature, Mann-Kendall, Theil-Sen, p-values and provenance.",
      },
      { property: "og:title", content: "How we know — Terra Earth" },
      {
        property: "og:description",
        content:
          "Satellites, statistics and honesty rules explained in plain language, in English and Bangla.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HowItWorksPage,
});

const MEASURED = [
  {
    icon: Leaf,
    term: "Vegetation — NDVI",
    bnTerm: "সবুজতা — NDVI",
    body: "Satellite cameras measure how strongly plants reflect light. The score, called NDVI, runs from about 0 (bare soil) to 1 (dense green canopy). Rising NDVI usually means more or healthier vegetation.",
    bnBody: "স্যাটেলাইট ক্যামেরা গাছ কতটা জোরে আলো প্রতিফলিত করে তা মাপে। এই স্কোরকে NDVI বলে; এটি প্রায় ০ (উন্মুক্ত মাটি) থেকে ১ (ঘন সবুজ) পর্যন্ত হয়। NDVI বাড়লে সাধারণত বোঝায় সবুজ গাছপালা বেশি বা সুস্থ।",
  },
  {
    icon: Thermometer,
    term: "Land surface temperature",
    bnTerm: "ভূ-পৃষ্ঠের তাপমাত্রা",
    body: "Infrared sensors measure how hot the ground itself is — pavements, fields, rooftops. On sunny afternoons the surface is often much hotter than the air, which is why this number can sit well above the air temperature on the same page.",
    bnBody: "ইনফ্রারেড সেন্সর মাটি, রাস্তা বা ছাদের নিজের তাপ মাপে। রোদেলা দুপুরে পৃষ্ঠ বাতাসের চেয়ে অনেক বেশি গরম হয়, তাই এই সংখ্যা একই পাতার বায়ুর তাপমাত্রার চেয়ে অনেক উপরে থাকতে পারে।",
  },
  {
    icon: Sun,
    term: "Air temperature",
    bnTerm: "বায়ুর তাপমাত্রা",
    body: "NASA POWER reports the air temperature about two metres above the ground, averaged over the month — the everyday temperature you would feel standing outside.",
    bnBody: "NASA POWER মাটি থেকে প্রায় দুই মিটার উপরে বাতাসের মাসিক গড় তাপমাত্রা দেয় — যে তাপমাত্রা দাঁড়িয়ে থাকলে আমরা অনুভব করি।",
  },
  {
    icon: CloudRain,
    term: "Rainfall & sunlight",
    bnTerm: "বৃষ্টিপাত ও সূর্যালোক",
    body: "The same NASA POWER record carries corrected monthly rainfall and the sunlight energy reaching the surface. All three come from the same satellite-era archive, 2001 onward.",
    bnBody: "একই NASA POWER রেকর্ডে সংশোধিত মাসিক বৃষ্টিপাত ও পৃথিবীর পৃষ্ঠে পৌঁছানো সূর্যালোকের পরিমাণ থাকে। তিনটিই ২০০১ সাল থেকে একই স্যাটেলাইট-যুগের সংগ্রহ থেকে আসে।",
  },
];

const METHOD_STEPS = [
  {
    icon: Database,
    step: "1",
    title: "Keep a fixed copy of the record",
    bnTitle: "রেকর্ডের একটি স্থির কপি রাখা",
    body: "Before any analysis, Terra Earth saves a copy of the NASA observations for each location. Every page and every visitor reads the same saved numbers, so results cannot quietly change between visits.",
    bnBody: "বিশ্লেষণের আগে প্রতিটি স্থানের নাসা পর্যবেক্ষণের একটি কপি সংরক্ষণ করা হয়। প্রতিটি পাতা ও প্রতিটি দর্শক একই সংরক্ষিত সংখ্যা দেখে, তাই ভিজিটের মাঝে ফলাফল নীরবে বদলাতে পারে না।",
  },
  {
    icon: TrendingUp,
    step: "2",
    title: "Ask: is there really a direction?",
    bnTitle: "প্রশ্ন: আসলেই কি কোনো দিক আছে?",
    body: "The Mann–Kendall test compares every year with every later year and asks whether rising pairs clearly outnumber falling pairs. It answers “does this series keep moving one way?” — not “how fast?”.",
    bnBody: "Mann–Kendall পরীক্ষা প্রতিটি বছরকে পরের প্রতিটি বছরের সঙ্গে মিলিয়ে দেখে, ঊর্ধ্বমুখী জোড়া কি নিম্নমুখী জোড়ার চেয়ে স্পষ্টভাবে বেশি। এটি বলে “এই সারি কি একদিকেই চলছে?” — “কত দ্রুত?” নয়।",
  },
  {
    icon: Ruler,
    step: "3",
    title: "Measure the pace with Theil–Sen",
    bnTitle: "Theil–Sen দিয়ে গতি মাপা",
    body: "Theil–Sen draws a line between every pair of years and keeps the middle slope. One strange heatwave year barely moves the median, so the rate of change — shown per decade — stays trustworthy.",
    bnBody: "Theil–Sen প্রতিটি বছরের জোড়ার মাঝে রেখা টানে এবং মাঝের ঢালটি রাখে। একটি অস্বাভাবিক গরম বছর মধ্যমাকে সামান্যই নড়ায়, তাই দশক ধরে হিসাব করা পরিবর্তনের হার নির্ভরযোগ্য থাকে।",
  },
  {
    icon: BadgeCheck,
    step: "4",
    title: "Let the p-value judge",
    bnTitle: "p-মানকে রায় দিতে দেওয়া",
    body: "The p-value is the chance of seeing a pattern this strong if the series were actually flat. When it drops below 0.05 — a 1-in-20 coincidence — we call the trend significant and show the badge.",
    bnBody: "p-মান হলো, সারিটি আসলে সমতল হলে এত জোরালো প্যাটার্ন দেখার সম্ভাবনা। এটি ০.০৫-এর নিচে নামলে — ২০-এ ১ কাকতালীয় — আমরা প্রবণতাটিকে তাৎপর্যপূর্ণ বলে ব্যাজ দেখাই।",
  },
  {
    icon: Receipt,
    step: "5",
    title: "Show the receipt",
    bnTitle: "রশিদটি দেখানো",
    body: "Every chart keeps its provenance beside it: the dataset ID, the source link, and when the record was retrieved. You can always trace a number back to NASA itself.",
    bnBody: "প্রতিটি চার্টের পাশে তথ্য-উৎস থাকে: ডেটাসেট ID, উৎসের লিংক এবং রেকর্ডটি কখন সংগ্রহ করা হয়েছিল। যেকোনো সংখ্যাকে নাসা পর্যন্ত খুঁজে যাওয়া সম্ভব।",
  },
  {
    icon: Eye,
    step: "6",
    title: "Admit the gaps",
    bnTitle: "শূন্যস্থান স্বীকার করা",
    body: "When a location has no cached record, the page says “Data not yet available” instead of guessing. An honest blank teaches more than an invented number.",
    bnBody: "কোনো স্থানের সংরক্ষিত রেকর্ড না থাকলে পাতাটি অনুমান না করে বলে “উপাত্ত এখনও পাওয়া যায়নি”। সৎ শূন্যস্থান বানানো সংখ্যার চেয়ে বেশি শেখায়।",
  },
];

const GLOSSARY = [
  {
    term: "Trend",
    bnTerm: "প্রবণতা",
    body: "A long, steady direction across many years of observations — not one hot summer or one rainy month.",
    bnBody: "বহু বছরের পর্যবেক্ষণে দীর্ঘ ও সুস্থির একটি দিক — এক গরম গ্রীষ্ম বা এক বর্ষার মাস নয়।",
  },
  {
    term: "Significance",
    bnTerm: "তাৎপর্য",
    body: "Whether the pattern passed the statistical test. A significant trend is one we can distinguish from random year-to-year noise.",
    bnBody: "প্যাটার্নটি পরিসংখ্যান পরীক্ষায় উত্তীর্ণ কি না। তাৎপর্যপূর্ণ প্রবণতা মানে বছরে-বছরে এলোমেলো ওঠানামা থেকে একে আলাদা করা যায়।",
  },
  {
    term: "Rate per decade",
    bnTerm: "দশকভিত্তিক হার",
    body: "The Theil–Sen slope multiplied by ten — how much the value changes across ten years, in the variable's own unit.",
    bnBody: "Theil–Sen ঢালকে দশ দিয়ে গুণ করলে যা হয় — দশ বছরে মানটি কতটা বদলায়, নিজস্ব এককে।",
  },
  {
    term: "Confidence band",
    bnTerm: "আস্থার ব্যাপ্তি",
    body: "On comparison charts, the shaded region where the true trend line most plausibly lies (95% confidence). A narrow band means a well-pinned trend.",
    bnBody: "তুলনার চার্টে ছায়াযুক্ত অঞ্চল, যেখানে প্রকৃত প্রবণতা রেখাটি সবচেয়ে সম্ভবত থাকে (৯৫% আস্থা)। সরু ব্যাপ্তি মানে প্রবণতা ভালোভাবে নির্ধারিত।",
  },
  {
    term: "Provenance",
    bnTerm: "তথ্য-উৎস",
    body: "The receipt for every number: dataset ID, source URL, and retrieval time. Open it from any chart's View evidence control.",
    bnBody: "প্রতিটি সংখ্যার রশিদ: ডেটাসেট ID, উৎসের লিংক ও সংগ্রহের সময়। যেকোনো চার্টের View evidence নিয়ন্ত্রণ থেকে খুলুন।",
  },
  {
    term: "Cache",
    bnTerm: "সংরক্ষিত কপি",
    body: "A pre-saved copy of NASA records stored with the site, so analysis always runs on the same tested values.",
    bnBody: "সাইটের সঙ্গে সংরক্ষিত নাসা রেকর্ডের কপি, যাতে বিশ্লেষণ সবসময় একই পরীক্ষিত মানের উপর চলে।",
  },
  {
    term: "Biome verdict",
    bnTerm: "বায়োম রায়",
    body: "A plain-language label — Stable, Greening, Drying, Warming stress — computed by fixed rules from the tested variables. No model invents it.",
    bnBody: "সহজ ভাষার লেবেল — সুস্থির, সবুজায়ন, শুষ্কতা, উষ্ণতার চাপ — পরীক্ষিত রাশিগুলো থেকে নির্দিষ্ট নিয়মে গণনা করা। কোনো মডেল এটি বানায় না।",
  },
];

const HONESTY = [
  {
    title: "No AI-made numbers",
    bnTitle: "কৃত্রিম বুদ্ধিমত্তার বানানো সংখ্যা নেই",
    body: "Statistics come only from tested code — Mann–Kendall and Theil–Sen. The AI assistant explains computed results; it never supplies climate values.",
    bnBody: "পরিসংখ্যান আসে শুধু পরীক্ষিত কোড থেকে — Mann–Kendall ও Theil–Sen। সহকারী গণনা করা ফলাফল ব্যাখ্যা করে; জলবায়ুর মান কখনো জোগাড় করে না।",
  },
  {
    title: "Pictures are not evidence",
    bnTitle: "ছবি প্রমাণ নয়",
    body: "Comic art, mascots and location scenery exist to explain and welcome. Only the charts and provenance panels carry measured claims.",
    bnBody: "কমিক অঙ্কন, মাসকট ও স্থানের দৃশ্য ব্যাখ্যা ও স্বাগতের জন্য। মাপা দাবি বহন করে শুধু চার্ট ও তথ্য-উৎস প্যানেল।",
  },
  {
    title: "Places, not national averages",
    bnTitle: "জায়গা, জাতীয় গড় নয়",
    body: "Comparisons use named representative capital points, each with its own record. They show how places differ — never a national average.",
    bnBody: "তুলনায় নাম-উল্লিখিত প্রতিনিধিত্বমূলক রাজধানী-বিন্দু ব্যবহৃত হয়, প্রতিটির নিজস্ব রেকর্ড সহ। এগুলো জায়গার পার্থক্য দেখায় — জাতীয় গড় কখনো নয়।",
  },
  {
    title: "One hot year is not a trend",
    bnTitle: "এক গরম বছর প্রবণতা নয়",
    body: "Weather jumps around every year. That is exactly why we test many years together before calling anything a trend.",
    bnBody: "আবহাওয়া প্রতি বছর ওঠানামা করে। এ কারণেই কোনো কিছুকে প্রবণতা বলার আগে আমরা একসঙ্গে বহু বছর পরীক্ষা করি।",
  },
];

function HowItWorksPage() {
  const { lang } = useLang();
  const L = (en: string, bn: string) => (lang === "bn" ? bn : en);

  return (
    <div className="mx-auto max-w-5xl px-3 py-8 sm:px-6 sm:py-12">
      <header className="max-w-3xl">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase text-accent">
          <Satellite className="h-4 w-4" aria-hidden /> {L("Plain-language guide", "সহজ ভাষার দিকনির্দেশ")}
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold leading-tight text-foreground sm:text-5xl">
          {L("How we know", "আমরা যেভাবে জানি")}
        </h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          {L(
            "Every number on Terra Earth comes from NASA satellites and is checked with fixed statistical tests before it reaches a chart. This guide explains each idea in everyday words — no equations required.",
            "টেরা আর্থর প্রতিটি সংখ্যা নাসার স্যাটেলাইট থেকে আসে এবং চার্টে পৌঁছানোর আগে নির্দিষ্ট পরিসংখ্যান পরীক্ষায় যাচাই হয়। এই দিকনির্দেশে প্রতিটি ধারণা রোজকার ভাষায় ব্যাখ্যা করা হলো — কোনো সমীকরণ লাগবে না।",
          )}
        </p>
      </header>

      <section className="mt-12" aria-labelledby="h-measured">
        <h2 id="h-measured" className="font-display text-2xl text-foreground sm:text-3xl">
          {L("What the satellites measure", "স্যাটেলাইট কী মাপে")}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
          {L(
            "Two NASA instruments feed every location page: MODIS Terra for vegetation and land-surface temperature, and NASA POWER for air temperature, rainfall and sunlight.",
            "প্রতিটি স্থান পাতায় দুটি নাসা যন্ত্রের তথ্য থাকে: সবুজতা ও ভূ-পৃষ্ঠের তাপমাত্রার জন্য MODIS Terra, আর বায়ুর তাপমাত্রা, বৃষ্টি ও সূর্যালোকের জন্য NASA POWER।",
          )}
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {MEASURED.map((m) => {
            const Icon = m.icon;
            return (
              <article key={m.term} className="panel p-5">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent/12 text-accent">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {lang === "bn" ? m.bnTerm : m.term}
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {lang === "bn" ? m.bnBody : m.body}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-14" aria-labelledby="h-method">
        <h2 id="h-method" className="font-display text-2xl text-foreground sm:text-3xl">
          {L("The detective method, step by step", "ডিটেকটিভ পদ্ধতি, ধাপে ধাপে")}
        </h2>
        <ol className="mt-6 space-y-4">
          {METHOD_STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <li key={s.step} className="panel flex gap-4 p-5">
                <div className="flex flex-col items-center gap-2">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/12 font-display text-sm font-bold text-primary">
                    {s.step}
                  </span>
                  <span className="h-full w-px flex-1 bg-border" aria-hidden />
                </div>
                <div>
                  <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
                    <Icon className="h-4 w-4 text-accent" aria-hidden />
                    {lang === "bn" ? s.bnTitle : s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    {lang === "bn" ? s.bnBody : s.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
        <p className="mt-6 max-w-3xl rounded-xl border border-border bg-elevated/60 p-4 text-sm leading-7 text-muted-foreground">
          {L(
            "Put together: Mann–Kendall says whether a real direction exists, Theil–Sen says how fast it moves, and the p-value says how confident we may be. A trend gets shown as significant only when all three agree.",
            "একসঙ্গে যোগ করলে: Mann–Kendall বলে প্রকৃত কোনো দিক আছে কি না, Theil–Sen বলে তা কত দ্রুত চলছে, আর p-মান বলে আমরা কতটা নিশ্চিত হতে পারি। তিনটি একমত হলেই প্রবণতাকে তাৎপর্যপূর্ণ দেখানো হয়।",
          )}
        </p>
      </section>

      <section className="mt-14" aria-labelledby="h-glossary">
        <h2 id="h-glossary" className="font-display text-2xl text-foreground sm:text-3xl">
          {L("Words on every card", "প্রতিটি কার্ডের শব্দ")}
        </h2>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          {GLOSSARY.map((g) => (
            <div key={g.term} className="panel p-5">
              <dt className="font-display text-base font-semibold text-foreground">
                {lang === "bn" ? g.bnTerm : g.term}
              </dt>
              <dd className="mt-2 text-sm leading-7 text-muted-foreground">
                {lang === "bn" ? g.bnBody : g.body}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-14" aria-labelledby="h-honesty">
        <h2 id="h-honesty" className="flex items-center gap-2 font-display text-2xl text-foreground sm:text-3xl">
          <TriangleAlert className="h-6 w-6 text-accent" aria-hidden />
          {L("Our honesty rules", "আমাদের সততার নিয়ম")}
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {HONESTY.map((h) => (
            <article key={h.title} className="panel p-5">
              <h3 className="font-display text-base font-semibold text-foreground">
                {lang === "bn" ? h.bnTitle : h.title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {lang === "bn" ? h.bnBody : h.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-14 border-t border-border pt-8">
        <p className="text-sm leading-7 text-muted-foreground">
          {L(
            "Ready to investigate yourself? Open any location from the globe, or see the full dataset list on Data & Methods.",
            "নিজে অনুসন্ধান করতে প্রস্তুত? গ্লোব থেকে যেকোনো স্থান খুলুন, বা উপাত্ত ও পদ্ধতি পাতায় পূর্ণ ডেটাসেট তালিকা দেখুন।",
          )}{" "}
          <Link to="/about" className="text-primary underline">
            {L("Data & Methods", "উপাত্ত ও পদ্ধতি")}
          </Link>
        </p>
      </section>
    </div>
  );
}
