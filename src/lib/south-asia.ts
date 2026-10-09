import { analyzeSeries, type TrendResult } from "@/lib/stats";
import type { CachedVariable, SeriesPoint, VariableKey } from "@/lib/climate";

export interface SouthAsiaLocation {
  id: string;
  name: string;
  bn: string;
  lat: number;
  lon: number;
  sample_type: string;
  variables: Partial<Record<VariableKey, CachedVariable>>;
}

const modules = import.meta.glob<SouthAsiaLocation>("../data/south-asia/*.json", {
  eager: true,
  import: "default",
});

export const southAsiaLocations = Object.values(modules).sort((a, b) =>
  a.name.localeCompare(b.name),
);

export function getRegionalSeries(id: string, variable: VariableKey): SeriesPoint[] {
  const annual = southAsiaLocations.find((location) => location.id === id)?.variables[variable]?.annual;
  if (!annual) return [];
  return Object.entries(annual)
    .map(([year, value]) => ({ year: Number(year), value }))
    .filter((point) => Number.isFinite(point.year) && Number.isFinite(point.value))
    .sort((a, b) => a.year - b.year);
}

export function getRegionalAnalysis(id: string, variable: VariableKey): TrendResult | null {
  return analyzeSeries(getRegionalSeries(id, variable));
}

/** Pearson correlation of overlapping annual anomalies; descriptive similarity, never causation. */
export function similarityToBangladesh(id: string, variable: VariableKey): number | null {
  if (id === "bangladesh") return 1;
  const bangladesh = new Map(getRegionalSeries("bangladesh", variable).map((point) => [point.year, point.value]));
  const pairs = getRegionalSeries(id, variable)
    .filter((point) => bangladesh.has(point.year))
    .map((point) => [bangladesh.get(point.year), point.value] as const)
    .filter((pair): pair is readonly [number, number] => pair[0] !== undefined);
  if (pairs.length < 5) return null;
  const meanA = pairs.reduce((sum, pair) => sum + pair[0], 0) / pairs.length;
  const meanB = pairs.reduce((sum, pair) => sum + pair[1], 0) / pairs.length;
  const numerator = pairs.reduce((sum, pair) => sum + (pair[0] - meanA) * (pair[1] - meanB), 0);
  const denominator = Math.sqrt(
    pairs.reduce((sum, pair) => sum + (pair[0] - meanA) ** 2, 0) *
      pairs.reduce((sum, pair) => sum + (pair[1] - meanB) ** 2, 0),
  );
  return denominator === 0 ? null : numerator / denominator;
}