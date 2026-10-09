/**
 * Offline-first data access layer.
 *
 * Every cached district file lives in src/data/cache/<district-id>.json and is
 * picked up automatically by the glob below. Dropping in a new district's
 * cached file makes that district fully functional with no other code change.
 * A district with no cached file resolves to `null` and the UI shows an honest
 * "data not yet available" state — never a fabricated number.
 */
import { globalLocations, parseGlobalLocation, type GlobalLocation } from "./global-locations";
import districtList from "@/data/districts.json";
import { analyzeSeries, type TrendResult } from "@/lib/stats";

export interface District extends GlobalLocation {
  id: string;
  name: string;
  bn: string;
  division: string;
  lat: number;
  lon: number;
}

export interface Provenance {
  dataset_id: string;
  source_url: string;
  retrieved: string;
  mode: "live" | "cache" | "fixture";
}

export interface CachedVariable {
  unit: string;
  label: string;
  annual: Record<string, number>;
  provenance: Provenance;
}

export interface CachedDistrict {
  district: string;
  variables: Partial<Record<VariableKey, CachedVariable>>;
}

export const VARIABLE_KEYS = [
  "ndvi",
  "lst",
  "temperature",
  "solar",
  "precipitation",
] as const;
export type VariableKey = (typeof VARIABLE_KEYS)[number];

export const VARIABLE_LABEL_KEY: Record<VariableKey, string> = {
  ndvi: "var.ndvi",
  lst: "var.lst",
  temperature: "var.temperature",
  solar: "var.solar",
  precipitation: "var.precipitation",
};

export const districts = [...(districtList as District[]), ...globalLocations]
  .slice()
  .sort((a, b) => a.name.localeCompare(b.name));

const modules = import.meta.glob<CachedDistrict>("../data/cache/*.json", {
  eager: true,
  import: "default",
});

const cache = new Map<string, CachedDistrict>();
const dynamicLocations = new Map<string, GlobalLocation>();
for (const [path, doc] of Object.entries(modules)) {
  const id = path.split("/").pop()?.replace(/\.json$/, "");
  if (!id) continue;
  cache.set(id, doc);
}

export function getDistrict(id: string): District | undefined {
  return dynamicLocations.get(id) ?? districts.find((d) => d.id === id) ?? parseGlobalLocation(id);
}

export function getCached(id: string): CachedDistrict | null {
  return cache.get(id) ?? null;
}

export function hasData(id: string): boolean {
  const doc = cache.get(id);
  if (!doc) return false;
  return Object.values(doc.variables).some(
    (v) => v && Object.keys(v.annual).length >= 5,
  );
}

export function availableVariables(id: string): VariableKey[] {
  const doc = cache.get(id);
  if (!doc) return [];
  return VARIABLE_KEYS.filter((k) => {
    const v = doc.variables[k];
    return !!v && Object.keys(v.annual).length >= 5;
  });
}

export function coveredDistrictIds(): string[] {
  return districts.filter((d) => hasData(d.id)).map((d) => d.id);
}

export interface SeriesPoint {
  year: number;
  value: number;
}

export function getSeries(
  districtId: string,
  variable: VariableKey,
  range?: { start: number; end: number },
): SeriesPoint[] {
  const v = cache.get(districtId)?.variables[variable];
  if (!v) return [];
  return Object.entries(v.annual)
    .map(([year, value]) => ({ year: Number(year), value }))
    .filter((p) => !range || (p.year >= range.start && p.year <= range.end))
    .sort((a, b) => a.year - b.year);
}

export interface VariableAnalysis {
  variable: VariableKey;
  unit: string;
  label: string;
  provenance: Provenance;
  series: SeriesPoint[];
  result: TrendResult;
}

export function analyzeVariable(
  districtId: string,
  variable: VariableKey,
  range?: { start: number; end: number },
): VariableAnalysis | null {
  const v = cache.get(districtId)?.variables[variable];
  if (!v) return null;
  const series = getSeries(districtId, variable, range);
  const result = analyzeSeries(series);
  if (!result) return null;
  return {
    variable,
    unit: v.unit,
    label: v.label,
    provenance: v.provenance,
    series,
    result,
  };
}

export function yearBounds(): { min: number; max: number } {
  let min = 9999;
  let max = 0;
  for (const doc of cache.values()) {
    for (const v of Object.values(doc.variables)) {
      for (const year of Object.keys(v?.annual ?? {})) {
        const y = Number(year);
        if (y < min) min = y;
        if (y > max) max = y;
      }
    }
  }
  return { min: min === 9999 ? 2001 : min, max: max === 0 ? 2024 : max };
}

/** Shape an admin-uploaded district data file must follow. */
export interface UploadedDataFile {
  unit: string;
  label?: string;
  annual: Record<string, number>;
}

/**
 * Analyse an admin-uploaded annual series with the same Mann-Kendall /
 * Theil-Sen code used for the NASA cache. Returns null when too short.
 */
export function analyzeUploaded(input: {
  variable: VariableKey;
  payload: UploadedDataFile;
  sourceName: string;
  sourceUrl: string;
  createdAt: string;
}): VariableAnalysis | null {
  const series = Object.entries(input.payload.annual ?? {})
    .map(([year, value]) => ({ year: Number(year), value: Number(value) }))
    .filter((p) => Number.isFinite(p.year) && Number.isFinite(p.value))
    .sort((a, b) => a.year - b.year);
  const result = analyzeSeries(series);
  if (!result) return null;
  return {
    variable: input.variable,
    unit: input.payload.unit,
    label: input.payload.label ?? input.sourceName,
    provenance: {
      dataset_id: input.sourceName,
      source_url: input.sourceUrl,
      retrieved: input.createdAt,
      mode: "cache",
    },
    series,
    result,
  };
}

/** Nearest district centroid to a point — used only to name a location, never to derive values. */
export function nearestDistrict(lat: number, lng: number): District | undefined {
  let best: District | undefined;
  let bestD = Infinity;
  for (const d of districts) {
    const dd = (d.lat - lat) ** 2 + ((d.lon - lng) * Math.cos((lat * Math.PI) / 180)) ** 2;
    if (dd < bestD) {
      bestD = dd;
      best = d;
    }
  }
  return best;
}

/** Register only observations fetched and validated by our NASA server loader. */
export function registerEvidence(location: GlobalLocation, document: CachedDistrict) {
 if (location.id.startsWith("g_")) dynamicLocations.set(location.id, location);
 else if (!districts.some(x => x.id === location.id)) districts.push(location);
 cache.set(location.id, document);
}

const regionalModules = import.meta.glob<{id:string;name:string;bn:string;lat:number;lon:number;variables:CachedDistrict["variables"]}>("../data/south-asia/*.json",{eager:true,import:"default"});
for (const point of Object.values(regionalModules)) registerEvidence({...point,division:point.name,sample_type:"capital representative point"},{district:point.id,variables:point.variables});
