import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { DETECTIVE_VARIABLE_KEYS, POWER_FIRST_YEAR, POWER_LAST_YEAR, sampleRegion, type RegionGeometry } from "./detective";

const cache = new Map<string, { time: number; data: Record<string, number> }>();
async function pointMonthly(param: string, lat: number, lon: number) {
  const key = `${param}:${lat.toFixed(2)}:${lon.toFixed(2)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.time < 86_400_000) return hit.data;
  const q = new URLSearchParams({ parameters: param, community: "RE", latitude: lat.toFixed(4), longitude: lon.toFixed(4), start: String(POWER_FIRST_YEAR), end: String(POWER_LAST_YEAR), format: "JSON" });
  const res = await fetch(`https://power.larc.nasa.gov/api/temporal/monthly/point?${q}`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`NASA POWER returned ${res.status}`);
  const payload = (await res.json()) as any;
  const raw: Record<string, number> = payload?.properties?.parameter?.[param] ?? {};
  const unit: string = payload?.parameters?.[param]?.units ?? "";
  const data: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!/^\d{6}$/.test(k) || Number(k.slice(4)) > 12 || typeof v !== "number" || v <= -900) continue;
    data[k] = param === "ALLSKY_SFC_SW_DWN" && unit.toLowerCase().startsWith("mj") ? v / 3.6 : v;
  }
  if (cache.size > 256) cache.delete(cache.keys().next().value ?? "");
  cache.set(key, { time: Date.now(), data });
  return data;
}

const regions = new Map<string, { name: string; geometry: RegionGeometry; bbox: { south: number; north: number; west: number; east: number } } | null>();
async function lookupRegion(query: string) {
  const key = query.toLowerCase();
  if (regions.has(key)) return regions.get(key)!;
  const q = new URLSearchParams({ q: query, format: "json", limit: "5", polygon_geojson: "1", polygon_threshold: "0.02" });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${q}`, { headers: { "User-Agent": "TerraEarth/1.0 (NASA Space Apps trend detective)", Accept: "application/json" }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error("boundary lookup failed");
  const list = (await res.json()) as { display_name: string; boundingbox: string[]; geojson?: { type: string; coordinates: unknown } }[];
  const hit = list.find((x) => x.geojson && (x.geojson.type === "Polygon" || x.geojson.type === "MultiPolygon"));
  const result = hit ? { name: hit.display_name, geometry: hit.geojson as RegionGeometry, bbox: { south: Number(hit.boundingbox[0]), north: Number(hit.boundingbox[1]), west: Number(hit.boundingbox[2]), east: Number(hit.boundingbox[3]) } } : null;
  if (regions.size > 64) regions.delete(regions.keys().next().value ?? "");
  regions.set(key, result);
  return result;
}

async function pooled<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>) {
  const out: R[] = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]!); } }));
  return out;
}

/**
 * Monthly NASA POWER records for one variable.
 * point  = the single grid cell at the coordinate;
 * area   = mean of a 3×3 block of cells (±1°);
 * region = mean of up to 24 regularly spaced cells inside a state/country boundary (OpenStreetMap).
 * A month is kept only when every sampled cell reports it.
 */
export const loadDetectiveSeries = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({
    variable: z.enum(DETECTIVE_VARIABLE_KEYS as [string, ...string[]]),
    lat: z.number().min(-90).max(90), lon: z.number().min(-180).max(180),
    scope: z.enum(["point", "area", "region"]),
    region: z.string().trim().min(2).max(80).optional(),
  }).parse(input))
  .handler(async ({ data }) => {
    let cells: { lat: number; lon: number }[] = [];
    let regionName: string | null = null;
    let regionPoints: { lat: number; lon: number }[] = [];
    if (data.scope === "region") {
      try {
        const region = await lookupRegion(data.region ?? "");
        if (!region) return { monthly: {}, error: "That state or country boundary was not found. Try its full English name.", cells: 0, regionName: null, regionPoints, provenance: null };
        regionName = region.name;
        cells = sampleRegion(region.geometry, region.bbox).points;
        if (!cells.length) cells = [{ lat: (region.bbox.south + region.bbox.north) / 2, lon: (region.bbox.west + region.bbox.east) / 2 }];
        regionPoints = cells;
      } catch {
        return { monthly: {}, error: "The boundary service is temporarily unavailable. No values were estimated.", cells: 0, regionName: null, regionPoints, provenance: null };
      }
    } else {
      const offsets = data.scope === "area" ? [-1, 0, 1] : [0];
      for (const dy of offsets) for (const dx of offsets) {
        const lat = Math.max(-89.75, Math.min(89.75, data.lat + dy));
        let lon = data.lon + dx; if (lon > 180) lon -= 360; if (lon < -180) lon += 360;
        cells.push({ lat, lon });
      }
    }
    try {
      const all = await pooled(cells, 6, (c) => pointMonthly(data.variable, c.lat, c.lon));
      const monthly: Record<string, number> = {};
      for (const k of Object.keys(all[0] ?? {})) {
        const vals = all.map((d) => d[k]);
        if (vals.every((v) => typeof v === "number")) monthly[k] = (vals as number[]).reduce((a, b) => a + b, 0) / vals.length;
      }
      const ref = cells[0]!;
      return {
        monthly, error: null as string | null, cells: cells.length, regionName, regionPoints,
        provenance: { dataset_id: "NASA_POWER_MONTHLY_RE", source_url: `https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=${data.variable}&community=RE&latitude=${ref.lat}&longitude=${ref.lon}&start=${POWER_FIRST_YEAR}&end=${POWER_LAST_YEAR}&format=JSON`, retrieved: new Date().toISOString() },
      };
    } catch {
      return { monthly: {}, error: "NASA POWER is temporarily unavailable. No values were estimated.", cells: cells.length, regionName, regionPoints, provenance: null };
    }
  });
