import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { VariableAnalysis } from "@/lib/climate";
import { VARIABLE_LABEL_KEY } from "@/lib/climate";
import { ProvenanceButton } from "@/components/ProvenanceDrawer";
import { fmt, useLang } from "@/lib/i18n";

export function SignificanceBadge({ analysis }: { analysis: VariableAnalysis }) {
  const { t } = useLang();
  const { trend } = analysis.result;
  const tone = !trend.significant_at_0_05
    ? "border-border text-muted-foreground"
    : trend.direction === "increasing"
      ? "border-rising text-rising"
      : "border-declining text-declining";
  const label = !trend.significant_at_0_05
    ? t("badge.notSignificant")
    : trend.direction === "increasing"
      ? `${t("badge.rising")} · ${t("badge.significant")}`
      : `${t("badge.falling")} · ${t("badge.significant")}`;
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${tone}`}>
      {label}
    </span>
  );
}

export function TrendCard({
  analysis,
  districtName,
}: {
  analysis: VariableAnalysis;
  districtName: string;
}) {
  const { t, lang } = useLang();
  const { result } = analysis;
  const decade = result.slope.slope_per_decade;
  const color =
    !result.trend.significant_at_0_05
      ? "var(--color-muted-foreground)"
      : decade > 0
        ? "var(--color-rising)"
        : "var(--color-declining)";
  const gradientId = `grad-${analysis.variable}`;

  return (
    <article className="panel p-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-display text-base font-semibold text-foreground">
            {t(VARIABLE_LABEL_KEY[analysis.variable])}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {result.period.start}–{result.period.end} · {result.n_observations}{" "}
            {t("card.observations")}
          </p>
        </div>
        <SignificanceBadge analysis={analysis} />
      </header>

      <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-2">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {t("card.current")}
          </p>
          <p className="font-display text-2xl font-semibold text-foreground">
            {fmt(result.current_value ?? 0, lang, analysis.variable === "ndvi" ? 3 : 2)}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              {analysis.unit}
            </span>
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {t("card.rate")}
          </p>
          <p className="text-sm font-semibold" style={{ color }}>
            {decade > 0 ? "+" : ""}
            {fmt(decade, lang, 3)} {analysis.unit} / {t("card.perDecade")}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {t("card.pvalue")}
          </p>
          <p className="text-sm font-semibold text-foreground">
            {result.trend.p_value < 0.001 ? "< 0.001" : result.trend.p_value.toFixed(3)}
          </p>
        </div>
      </div>

      <div className="mt-3 h-24 w-full min-w-0" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={analysis.series} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.5} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis dataKey="year" hide />
            <YAxis domain={["dataMin", "dataMax"]} hide />
            <Tooltip
              contentStyle={{
                background: "var(--color-elevated)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--color-foreground)",
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <table className="sr-only">
        <caption>
          {t(VARIABLE_LABEL_KEY[analysis.variable])} — {districtName}
        </caption>
        <tbody>
          {analysis.series.map((p) => (
            <tr key={p.year}>
              <th scope="row">{p.year}</th>
              <td>
                {p.value} {analysis.unit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <footer className="mt-3 flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted-foreground">{analysis.provenance.dataset_id}</span>
        <ProvenanceButton
          provenance={analysis.provenance}
          title={`${districtName} · ${t(VARIABLE_LABEL_KEY[analysis.variable])}`}
          payload={{
            district: districtName,
            variable: analysis.variable,
            unit: analysis.unit,
            period: result.period,
            n_observations: result.n_observations,
            trend: result.trend,
            slope: result.slope,
            provenance: analysis.provenance,
            series: analysis.series,
          }}
        />
      </footer>
    </article>
  );
}
