import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { BookOpen, Database, ExternalLink, FileText, FlaskConical, Library, LoaderCircle, LockKeyhole, LogIn, MessageSquareText, Microscope, Satellite, Youtube } from "lucide-react";
import { listEvidenceReferences } from "@/lib/chat.functions";
import { supabase } from "@/integrations/supabase/client";
import { MessageResponse } from "@/components/ai-elements/message";

export const Route = createFileRoute("/reference")({
  head: () => ({
    meta: [
      { title: "Reference & Research — TerraBangla" },
      {
        name: "description",
        content: "Scientific references, NASA Space Apps documentation, and project video for TerraBangla.",
      },
      { property: "og:title", content: "Reference, research & project video — TerraBangla" },
      {
        property: "og:description",
        content: "How MEC TERRA_DETECTORS built TerraBangla for NASA Space Apps, with research methods, source documentation and project video.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReferencePage,
});

const RESEARCH_LINKS = [
  {
    title: "NASA POWER Project",
    bnTitle: "NASA POWER প্রকল্প",
    description: "Monthly air temperature, precipitation and solar-radiation observations used by TerraBangla.",
    bnDescription: "টেরা বাংলায় ব্যবহৃত মাসিক বায়ুর তাপমাত্রা, বৃষ্টিপাত ও সৌর বিকিরণ পর্যবেক্ষণ।",
    url: "https://power.larc.nasa.gov/",
  },
  {
    title: "NASA MODIS Web Service",
    bnTitle: "NASA MODIS ওয়েব সার্ভিস",
    description: "Satellite vegetation (NDVI) and land-surface-temperature records used in district evidence.",
    bnDescription: "জেলার প্রমাণে ব্যবহৃত স্যাটেলাইট উদ্ভিদ সূচক (NDVI) ও ভূপৃষ্ঠের তাপমাত্রা।",
    url: "https://modis.ornl.gov/rst/api/v1/",
  },
  {
    title: "NASA Space Apps Challenge",
    bnTitle: "NASA Space Apps Challenge",
    description: "The global challenge programme for which MEC TERRA_DETECTORS created TerraBangla.",
    bnDescription: "যে বৈশ্বিক চ্যালেঞ্জের জন্য MEC TERRA_DETECTORS টেরা বাংলা তৈরি করেছে।",
    url: "https://www.spaceappschallenge.org/",
  },
  {
    title: "geoBoundaries",
    bnTitle: "geoBoundaries",
    description: "Open administrative boundaries used to represent Bangladesh’s 64 districts.",
    bnDescription: "বাংলাদেশের ৬৪টি জেলা দেখাতে ব্যবহৃত উন্মুক্ত প্রশাসনিক সীমানা।",
    url: "https://www.geoboundaries.org/",
  },
];

const YOUTUBE_VIDEO_ID = "g3T5h9Zs05g";
const YOUTUBE_VIDEO_URL = `https://www.youtube-nocookie.com/embed/${YOUTUBE_VIDEO_ID}`;
const YOUTUBE_SUBMISSION_URL = `https://youtu.be/${YOUTUBE_VIDEO_ID}`;

type EvidenceReference = Awaited<ReturnType<typeof listEvidenceReferences>>[number];

const METHOD_STEPS = [
  {
    icon: Database,
    en: "Cache observations",
    bn: "পর্যবেক্ষণ সংরক্ষণ",
    enBody: "NASA POWER and MODIS observations are cached before analysis; missing records never become estimated values.",
    bnBody: "বিশ্লেষণের আগে NASA POWER ও MODIS পর্যবেক্ষণ সংরক্ষণ করা হয়; অনুপস্থিত রেকর্ডকে কখনো অনুমান করা হয় না।",
  },
  {
    icon: Microscope,
    en: "Test the trend",
    bn: "প্রবণতা পরীক্ষা",
    enBody: "Mann–Kendall tests direction and significance; Theil–Sen estimates the robust rate of change.",
    bnBody: "Mann–Kendall দিক ও তাৎপর্য পরীক্ষা করে; Theil–Sen পরিবর্তনের নির্ভরযোগ্য হার নির্ণয় করে।",
  },
  {
    icon: Satellite,
    en: "Show the evidence",
    bn: "প্রমাণ দেখানো",
    enBody: "Every chart keeps its dataset ID, source URL and retrieval record beside the result.",
    bnBody: "প্রতিটি চার্টের ফলাফলের সঙ্গে ডেটাসেট ID, উৎসের লিংক ও সংগ্রহের তথ্য রাখা হয়।",
  },
];

function ReferencePage() {
  const { t, lang } = useLang();
  const L = (en: string, bn: string) => (lang === "bn" ? bn : en);

  return (
    <div className="mx-auto max-w-6xl px-3 py-8 sm:px-6 sm:py-12">
      <header className="max-w-4xl">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase text-accent">
          <Library className="h-4 w-4" aria-hidden /> MEC TERRA_DETECTORS
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold leading-tight text-foreground sm:text-6xl">{t("reference.title")}</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
          {L(
            "The challenge connection, research method, source documentation and presentation evidence behind TerraBangla.",
            "টেরা বাংলার পেছনের চ্যালেঞ্জ-সংযোগ, গবেষণা পদ্ধতি, উৎসের নথি ও উপস্থাপনার প্রমাণ।",
          )}
        </p>
      </header>

      <section className="mt-12 border-y border-border py-8 sm:grid sm:grid-cols-[0.72fr_1.28fr] sm:gap-10">
        <div>
          <p className="text-xs font-semibold uppercase text-accent">NASA Space Apps Challenge 2026</p>
          <h2 className="mt-2 font-display text-2xl text-foreground sm:text-3xl">{t("reference.nasa_apps")}</h2>
        </div>
        <div className="mt-5 sm:mt-0">
          <p className="text-sm leading-7 text-muted-foreground">
            {lang === "bn"
              ? "MEC TERRA_DETECTORS নাসা স্পেস অ্যাপস চ্যালেঞ্জ ২০২৬-এর ‘Be An Earth System Trend Detective!’ চ্যালেঞ্জের জন্য টেরা বাংলা তৈরি করেছে। প্রকল্পটি NASA Earth-observation রেকর্ডকে বাংলাদেশের ৬৪ জেলার অনুসন্ধানযোগ্য জলবায়ু প্রমাণে রূপ দেয়—কোনো অনুপস্থিত মান বানানো ছাড়া।"
              : "MEC TERRA_DETECTORS built TerraBangla for the NASA Space Apps Challenge 2026 challenge, ‘Be An Earth System Trend Detective!’. It turns NASA Earth-observation records into explorable climate evidence for all 64 districts of Bangladesh—without inventing missing values."}
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-foreground">
            <span className="rounded-full border border-border bg-elevated px-3 py-1.5">Bangladesh</span>
            <span className="rounded-full border border-border bg-elevated px-3 py-1.5">64 districts</span>
            <span className="rounded-full border border-border bg-elevated px-3 py-1.5">NASA open data</span>
            <span className="rounded-full border border-border bg-elevated px-3 py-1.5">Apache-2.0</span>
          </div>
        </div>
      </section>

      <section className="mt-12 grid gap-5 lg:grid-cols-[1.45fr_0.55fr] lg:items-start">
        <div>
          <p className="text-xs font-semibold uppercase text-accent">{L("Team presentation", "দলের উপস্থাপনা")}</p>
          <h2 className="mt-2 font-display text-2xl text-foreground sm:text-3xl">{t("reference.video_preview")}</h2>
          <div className="mt-5 overflow-hidden rounded-lg border border-border bg-elevated shadow-panel">
          <AspectRatio ratio={16 / 9}>
              <iframe
                className="h-full w-full"
                src={YOUTUBE_VIDEO_URL}
                title={L("TerraBangla project presentation", "টেরা বাংলা প্রকল্প উপস্থাপনা")}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
          </AspectRatio>
          </div>
        </div>
        <aside className="border-t border-border pt-5 lg:mt-16 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <Youtube className="h-6 w-6 text-primary" aria-hidden />
          <h3 className="mt-3 font-display text-xl text-foreground">{L("Submission record", "সাবমিশন রেকর্ড")}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {L("The official team presentation is embedded here with its direct YouTube submission link.", "দলের অফিসিয়াল উপস্থাপনাটি সরাসরি YouTube সাবমিশন লিংকসহ এখানে যুক্ত আছে।")}
          </p>
          <Button asChild variant="outline" className="mt-4">
            <a href={YOUTUBE_SUBMISSION_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink aria-hidden />{L("Open submission video", "সাবমিশন ভিডিও খুলুন")}
            </a>
          </Button>
        </aside>
      </section>

      <EvidenceReferenceLibrary lang={lang} />

      <section className="mt-12">
        <p className="text-xs font-semibold uppercase text-accent">{L("Reproducible method", "পুনরুৎপাদনযোগ্য পদ্ধতি")}</p>
        <h2 className="mt-2 font-display text-2xl text-foreground sm:text-3xl">{t("reference.research_links")}</h2>
        <div className="mt-5 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">
          {METHOD_STEPS.map(({ icon: Icon, en, bn, enBody, bnBody }, index) => (
            <article key={en} className="bg-card p-5">
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5 text-primary" aria-hidden />
                <span className="font-mono text-xs text-muted-foreground">0{index + 1}</span>
              </div>
              <h3 className="mt-5 font-display text-lg text-foreground">{L(en, bn)}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{L(enBody, bnBody)}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/about"><BookOpen aria-hidden />{L("Read data & methods", "উপাত্ত ও পদ্ধতি পড়ুন")}</Link>
          </Button>
          <Button asChild variant="outline">
            <a href="https://www.spaceappschallenge.org/" target="_blank" rel="noopener noreferrer">
              <ExternalLink aria-hidden />{L("Visit NASA Space Apps", "NASA Space Apps দেখুন")}
            </a>
          </Button>
        </div>

        <h3 className="mt-10 font-display text-xl text-foreground">{L("Primary references", "প্রধান রেফারেন্স")}</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {RESEARCH_LINKS.map((link) => (
            <a
              key={link.title}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group panel block p-5"
            >
              <div className="flex items-start justify-between">
                <h4 className="font-display text-lg font-semibold text-foreground group-hover:text-primary">{L(link.title, link.bnTitle)}</h4>
                <ExternalLink className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{L(link.description, link.bnDescription)}</p>
              <p className="mt-3 truncate text-xs text-primary">{link.url}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="mt-12 border-t border-border pt-8">
        <div className="flex items-start gap-3">
          <FileText className="mt-1 h-5 w-5 shrink-0 text-accent" aria-hidden />
          <div>
            <h2 className="font-display text-2xl text-foreground">{L("Documentation scope", "ডকুমেন্টেশনের পরিধি")}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
              {L(
                "The documentation covers the 3D globe workflow, all 64 district records, five climate variables, provenance, heatmap exports, statistical comparison, the grounded AI Evidence Lab, the children’s learning studio, accessibility and PWA installation.",
                "ডকুমেন্টেশনে 3D গ্লোবের ধাপ, ৬৪ জেলার রেকর্ড, পাঁচটি জলবায়ু চলক, provenance, heatmap export, পরিসংখ্যানগত তুলনা, grounded AI Evidence Lab, শিশুদের শেখার স্টুডিও, accessibility ও PWA installation অন্তর্ভুক্ত।",
              )}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function EvidenceReferenceLibrary({ lang }: { lang: "en" | "bn" }) {
  const L = (en: string, bn: string) => (lang === "bn" ? bn : en);
  const [status, setStatus] = useState<"loading" | "signed-out" | "ready" | "error">("loading");
  const [references, setReferences] = useState<EvidenceReference[]>([]);

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(async ({ data, error }) => {
      if (!active) return;
      if (error || !data.user) {
        setStatus("signed-out");
        return;
      }
      try {
        const result = await listEvidenceReferences();
        if (!active) return;
        setReferences(result);
        setStatus("ready");
      } catch {
        if (active) setStatus("error");
      }
    });
    return () => { active = false; };
  }, []);

  const signInForReferences = () => {
    sessionStorage.setItem("terrabangla-auth-next", "/reference");
  };

  return (
    <section className="mt-12 border-y border-border py-8" aria-labelledby="my-evidence-title">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase text-accent">
            <LockKeyhole className="h-4 w-4" aria-hidden />{L("Private research record", "ব্যক্তিগত গবেষণা রেকর্ড")}
          </p>
          <h2 id="my-evidence-title" className="mt-2 font-display text-2xl text-foreground sm:text-3xl">
            {L("My Evidence Lab references", "আমার Evidence Lab রেফারেন্স")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {L("Every completed Evidence Lab question and grounded answer is saved here for your account only.", "Evidence Lab-এ সম্পন্ন প্রতিটি প্রশ্ন ও প্রমাণভিত্তিক উত্তর শুধু আপনার অ্যাকাউন্টের জন্য এখানে সংরক্ষিত থাকে।")}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/chat"><FlaskConical aria-hidden />{L("Open Evidence Lab", "Evidence Lab খুলুন")}</Link>
        </Button>
      </div>

      {status === "loading" ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
          <LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />{L("Loading your references…", "আপনার রেফারেন্স লোড হচ্ছে…")}
        </div>
      ) : null}

      {status === "signed-out" ? (
        <div className="mt-6 border-l-2 border-primary bg-elevated/50 p-5">
          <p className="text-sm leading-6 text-muted-foreground">{L("Sign in to see your private submitted questions and answers.", "আপনার ব্যক্তিগত জমা দেওয়া প্রশ্ন ও উত্তর দেখতে সাইন ইন করুন।")}</p>
          <Button asChild className="mt-4" onClick={signInForReferences}>
            <Link to="/auth"><LogIn aria-hidden />{L("Sign in with Google", "Google দিয়ে সাইন ইন করুন")}</Link>
          </Button>
        </div>
      ) : null}

      {status === "error" ? <p className="mt-6 text-sm text-destructive" role="alert">{L("Your saved references could not be loaded. Please try again.", "আপনার সংরক্ষিত রেফারেন্স লোড করা যায়নি। আবার চেষ্টা করুন।")}</p> : null}

      {status === "ready" && references.length === 0 ? (
        <div className="mt-6 border border-dashed border-border p-6 text-center">
          <MessageSquareText className="mx-auto h-7 w-7 text-accent" aria-hidden />
          <p className="mt-3 font-display text-lg text-foreground">{L("No completed answers yet", "এখনও কোনো সম্পন্ন উত্তর নেই")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{L("Submit a question in Evidence Lab; its completed answer will appear here automatically.", "Evidence Lab-এ একটি প্রশ্ন জমা দিন; সম্পন্ন উত্তরটি এখানে স্বয়ংক্রিয়ভাবে দেখা যাবে।")}</p>
        </div>
      ) : null}

      {status === "ready" && references.length > 0 ? (
        <div className="mt-6 space-y-4">
          {references.map((reference, index) => (
            <article key={reference.id} className="panel p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="font-mono">{String(index + 1).padStart(2, "0")} · {reference.conversationTitle}</span>
                <time dateTime={reference.createdAt}>{new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-US", { dateStyle: "medium" }).format(new Date(reference.createdAt))}</time>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
                <div>
                  <p className="text-xs font-semibold uppercase text-primary">{L("Question", "প্রশ্ন")}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">{reference.question}</p>
                </div>
                <div className="border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                  <p className="text-xs font-semibold uppercase text-accent">{L("Grounded answer", "প্রমাণভিত্তিক উত্তর")}</p>
                  <MessageResponse className="mt-2 text-sm leading-7 text-muted-foreground">{reference.answer}</MessageResponse>
                </div>
              </div>
              <Button asChild variant="link" className="mt-3 px-0">
                <Link to="/chat/$conversationId" params={{ conversationId: reference.conversationId }}>{L("Open full conversation", "সম্পূর্ণ আলোচনা খুলুন")}</Link>
              </Button>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
