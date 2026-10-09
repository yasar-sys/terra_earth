import { Link, createFileRoute, notFound } from "@tanstack/react-router";
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
        meta: [{ title: "District unavailable — TerraBangla" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `${loaderData.name} climate trends — TerraBangla`;
    const description = `NASA-derived vegetation, temperature, solar and rainfall trends for ${loaderData.name} district, ${loaderData.division} division, Bangladesh.`;
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
      <h1 className="font-display text-2xl text-foreground">District not found</h1>
      <Link to="/" className="mt-4 inline-block text-primary underline">
        Back to the globe
      </Link>
    </div>
  ),
});

function DistrictDetail() {
  const { districtId } = Route.useParams();
  const { t, lang } = useLang();
  const district = getDistrict(districtId)!;
  const cachedAnalyses = VARIABLE_KEYS.map((key) => analyzeVariable(districtId, key)).filter(
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
            {district.division} · {district.lat.toFixed(3)}°N, {district.lon.toFixed(3)}°E
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

      {analyses.length === 0 ? (
        <section className="panel mt-6 p-6">
          <h2 className="font-display text-xl text-accent">{t("district.nodata")}</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {t("district.nodata.detail")}
          </p>
        </section>
      ) : (
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

          <StudentInsight
            districtId={districtId}
            variable={available.includes("temperature") ? "temperature" : available[0]!}
            start={analyses[0]!.result.period.start}
            end={analyses[0]!.result.period.end}
          />

          {available.length < VARIABLE_KEYS.length ? (
            <p className="mt-4 text-xs text-muted-foreground">
              {lang === "bn" ? "এখনও সংরক্ষিত হয়নি: " : "Not cached yet for this district: "}
              {VARIABLE_KEYS.filter((k) => !available.includes(k))
                .map((k) => t(VARIABLE_LABEL_KEY[k]))
                .join(", ")}
              .
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
