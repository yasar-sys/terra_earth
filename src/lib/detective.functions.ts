import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { DETECTIVE_VARIABLE_KEYS, POWER_FIRST_YEAR, POWER_LAST_YEAR } from "./detective";

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

/**
 * Monthly NASA POWER records for one variable. "point" = the single 0.5° cell at the coordinate;
 * "area" = the mean of a 3×3 block of cells (±1° around the point), only for months every cell reports.
 */
export const loadDetectiveSeries = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({
    variable: z.enum(DETECTIVE_VARIABLE_KEYS as [string, ...string[]]),
    lat: z.number().min(-90).max(90), lon: z.number().min(-180).max(180),
    scope: z.enum(["point", "area"]),
  }).parse(input))
  .handler(async ({ data }) => {
    const offsets = data.scope === "area" ? [-1, 0, 1] : [0];
    const cells: { lat: number; lon: number }[] = [];
    for (const dy of offsets) for (const dx of offsets) {
      const lat = Math.max(-89.75, Math.min(89.75, data.lat + dy));
      let lon = data.lon + dx; if (lon > 180) lon -= 360; if (lon < -180) lon += 360;
      cells.push({ lat, lon });
    }
    try {
      const all = await Promise.all(cells.map((c) => pointMonthly(data.variable, c.lat, c.lon)));
      const monthly: Record<string, number> = {};
      for (const k of Object.keys(all[0] ?? {})) {
        const vals = all.map((d) => d[k]);
        if (vals.every((v) => typeof v === "number")) monthly[k] = (vals as number[]).reduce((a, b) => a + b, 0) / vals.length;
      }
      return {
        monthly, error: null as string | null, cells: cells.length,
        provenance: { dataset_id: "NASA_POWER_MONTHLY_RE", source_url: `https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=${data.variable}&latitude=${data.lat}&longitude=${data.lon}`, retrieved: new Date().toISOString() },
      };
    } catch {
      return { monthly: {}, error: "NASA POWER is temporarily unavailable. No values were estimated.", cells: cells.length, provenance: null };
    }
  });
