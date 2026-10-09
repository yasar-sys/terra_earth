import { useLocationEvidence } from "@/lib/location-evidence";
import { coordinatesLabel } from "@/lib/global-locations";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { DistrictLearning } from "@/components/DistrictLearning";
import { TrendCard } from "@/components/TrendCard";
import { ProvenanceButton } from "@/components/ProvenanceDrawer";
import { classifyBiome } from "@/lib/biome";
import {
  analyzeVariable,
  getDistrict,
  VARIABLE_KEYS,
  VARIABLE_LABEL_KEY,
} from "@/lib/climate";
import { useLang } from "@/lib/i18n";
import { StudentInsight } from "@/components/StudentInsight";
import { useUploadedAnalyses } from "@/lib/public-content";
import { FavoriteDistrictButton } from "@/components/FavoriteDistrictButton";

export const Route = createFileRoute("/district/$districtId")({
  loader: ({ params }) => {
    const district = getDistrict(params.districtId);
    if (!district) throw notFound();
    return { name: district.name, division: district.division };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Location unavailable — Terra Earth" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `${loaderData.name} climate trends — Terra Earth`;
    const description = `NASA-derived vegetation, temperature, solar and rainfall trends for ${loaderData.name}, ${loaderData.division}, at its named sample coordinates.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: DistrictDetail,
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-3 py-16 text-center sm:px-6">
      <h1 className="font-display text-2xl text-foreground">Location not found</h1>
      <Link to="/" className="mt-4 inline-block text-primary underline">
        Back to the globe
      </Link>
    </div>
  ),
});

function DistrictDetail() {
  const { districtId } = Route.useParams();
  const { t, lang } = useLang();
  const [includeModis, setIncludeModis] = useState(false);
  const evidence = useLocationEvidence(districtId, includeModis);
  const district = getDistrict(districtId);
  if (!district) return null;
  const cachedAnalyses = VARIABLE_KEYS.map((key) => districtId.startsWith("g_") && !evidence.hydrated ? null : analyzeVariable(districtId, key)).filter(
    (a): a is NonNullable<typeof a> => a !== null,
  );
  // Admin-uploaded files fill in variables the NASA cache does not have yet.
  const uploaded = useUploadedAnalyses(districtId).filter(
    (u) => !cachedAnalyses.some((c) => c.variable === u.variable),
  );
  const analyses = [...cachedAnalyses, ...uploaded];
  const available = analyses.map((a) => a.variable);
  const biome = classifyBiome(districtId);
  const name = lang === "bn" ? district.bn : district.name;

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
        <Link to="/" className="text-primary hover:underline">
          {t("nav.globe")}
        </Link>
        <span aria-hidden> / </span>
        <span>{name}</span>
      </nav>

      <header className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground sm:text-4xl">{name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {district.division} · {coordinatesLabel(district.lat, district.lon)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <FavoriteDistrictButton districtId={districtId} />
          <Link
            to="/compare"
            search={{ districtA: districtId, districtB: undefined }}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-secondary"
          >
            {t("nav.compare")}
          </Link>
          <Link
            to="/heatmap"
            className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-secondary"
          >
            {t("nav.heatmap")}
          </Link>
        </div>
      </header>

      <p className="mt-3 text-xs text-muted-foreground">{lang === "bn" ? "এই স্থানাঙ্কের নমুনা; দেশের গড় নয়।" : "Evidence at this sample coordinate — not a country-wide average."}</p>
      {districtId.startsWith("g_") ? <div className="mt-4 flex flex-wrap items-center gap-3"><Button variant="outline" onClick={() => setIncludeModis(true)} disabled={includeModis || evidence.isFetching}>{lang === "bn" ? "MODIS উদ্ভিদ ও ভূপৃষ্ঠের তথ্য লোড করুন" : "Load MODIS vegetation & land temperature"}</Button>{evidence.isFetching ? <p role="status" className="text-sm text-accent">{lang === "bn" ? "NASA রেকর্ড লোড হচ্ছে…" : "Loading NASA records…"}</p> : null}{evidence.isError ? <Button variant="outline" onClick={() => void evidence.refetch()}>Retry NASA</Button> : null}</div> : null}
      {evidence.data?.warnings.map(w => <p key={w} role="status" className="mt-2 text-xs text-accent">{w}</p>)}
      {analyses.length === 0 && !evidence.isFetching ? (
        <section className="panel mt-6 p-6">
          <h2 className="font-display text-xl text-accent">{t("district.nodata")}</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {t("district.nodata.detail")}
          </p>
        </section>
      ) : analyses.length > 0 ? (
        <>
          <section aria-labelledby="biome-heading" className="panel mt-6 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="biome-heading" className="font-display text-xl text-foreground">
                {t("biome.title")}
              </h2>
              <ProvenanceButton
                provenance={{
                  dataset_id: "DERIVED_BIOME_CLASSIFIER_V1",
                  source_url:
                    "Deterministic rule set over Mann-Kendall significance and Theil-Sen slope signs of NDVI, temperature and precipitation (src/lib/biome.ts)",
                  retrieved: new Date().toISOString(),
                  mode: "cache",
                }}
                title={`${district.name} · ${t("biome.title")}`}
                payload={biome}
              />
            </div>
            <p className="mt-2">
              <span className="rounded-full border border-accent px-3 py-1 font-display text-lg font-semibold text-accent">
                {t(biome.labelKey)}
              </span>
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {lang === "bn" ? biome.explanation.bn : biome.explanation.en}
            </p>
          </section>

          <h2 className="mt-8 font-display text-xl text-foreground">{t("district.overview")}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {analyses.map((analysis) => (
              <TrendCard key={analysis.variable} analysis={analysis} districtName={district.name} />
            ))}
          </div>

          <DistrictLearning districtId={districtId} variable={available.includes("temperature") ? "temperature" : available[0] ?? "temperature"} />
          <StudentInsight
            districtId={districtId}
            variable={available.includes("temperature") ? "temperature" : available[0] ?? "temperature"}
            start={analyses[0]?.result.period.start ?? 2015}
            end={analyses[0]?.result.period.end ?? 2024}
          />

          {available.length < VARIABLE_KEYS.length ? (
            <p className="mt-4 text-xs text-muted-foreground">
              {lang === "bn" ? "এখনও সংরক্ষিত হয়নি: " : "Not available for this location: "}
              {VARIABLE_KEYS.filter((k) => !available.includes(k))
                .map((k) => t(VARIABLE_LABEL_KEY[k]))
                .join(", ")}
              .
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
