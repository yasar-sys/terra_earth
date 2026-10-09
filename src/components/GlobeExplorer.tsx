import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import {
  districts,
  getSeries,
  hasData,
  nearestDistrict,
  VARIABLE_LABEL_KEY,
  type VariableKey,
} from "@/lib/climate";
import { normalize, rampColor, spectralColor } from "@/lib/colors";
import { fmt, useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Vector3 } from "three";
import { southAsiaLocations } from "@/lib/south-asia";

const BD_CENTER = { lat: 23.75, lng: 90.35 };
const FLY_MS = 1600;
const EMPTY: object[] = [];
const WORLD_LABELS = [{ lat: BD_CENTER.lat, lng: BD_CENTER.lng, text: "Bangladesh" }];
const WORLD_RINGS = [{ lat: BD_CENTER.lat, lng: BD_CENTER.lng }];
const DIVISION_CENTRES = new Set([
  "barishal",
  "chattogram",
  "dhaka",
  "khulna",
  "mymensingh",
  "rajshahi",
  "rangpur",
  "sylhet",
]);
const sideColor = () => "rgba(124, 111, 240, 0.72)";
const strokeColor = () => "rgba(124, 111, 240, 0.98)";
const ringColorFn = () => (t: number) => `rgba(124, 111, 240, ${Math.max(0, 0.92 - t)})`;

interface Feature {
  type: "Feature";
  properties: { districtId: string; name: string };
  geometry: unknown;
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export interface GlobeExplorerProps {
  variable: VariableKey;
  phase: "world" | "bangladesh";
  onPhaseChange: (phase: "world" | "bangladesh") => void;
  onSelectDistrict: (districtId: string) => void;
  hexMode?: boolean;
  gridPoints?: { lat: number; lng: number; value: number; sig?: boolean }[];
  gridUnit?: string;
  gridCaption?: string;
  regionalMode?: boolean;
  selectedRegionalId?: string;
  onSelectRegional?: (id: string) => void;
}

export default function GlobeExplorer({
  variable,
  phase,
  onPhaseChange,
  onSelectDistrict,
  hexMode = false,
  gridPoints = [],
  gridUnit = "",
  gridCaption = "",
  regionalMode = false,
  selectedRegionalId = "bangladesh",
  onSelectRegional,
}: GlobeExplorerProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { t, lang } = useLang();
  const [size, setSize] = useState({ w: 320, h: 420 });
  const [features, setFeatures] = useState<Feature[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import("@/data/bangladesh-districts.geojson.json").then((mod) => {
      if (!cancelled) {
        setFeatures((mod.default as { features: Feature[] }).features);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const w = Math.floor(el.clientWidth);
      const h = Math.floor(el.clientHeight);
      setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    };
    const ro = new ResizeObserver(update);
    ro.observe(el);
    update();
    return () => ro.disconnect();
  }, []);

  // Latest cached value per district for the active variable — real data only.
  const values = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of districts) {
      const series = getSeries(d.id, variable);
      const last = series[series.length - 1];
      if (last) map.set(d.id, last.value);
    }
    return map;
  }, [variable]);

  const bounds = useMemo(() => {
    const vals = [...values.values()];
    return vals.length
      ? { min: Math.min(...vals), max: Math.max(...vals) }
      : { min: 0, max: 1 };
  }, [values]);

  const flyTo = useCallback((lat: number, lng: number, altitude: number) => {
    const ms = prefersReducedMotion() ? 0 : FLY_MS;
    globeRef.current?.pointOfView({ lat, lng, altitude }, ms);
    return ms;
  }, []);

  useEffect(() => {
    if (hexMode) return;
    const controls = globeRef.current?.controls() as
      | { autoRotate: boolean; autoRotateSpeed: number; enableZoom: boolean }
      | undefined;
    if (!controls) return;
    controls.autoRotate = phase === "world" && !prefersReducedMotion();
    controls.autoRotateSpeed = 0.35;
  }, [phase, size, hexMode]);

  useEffect(() => {
    if (hexMode) return;
    if (phase === "world") flyTo(20, 60, 2.4);
    else flyTo(BD_CENTER.lat, BD_CENTER.lng, 0.24);
  }, [phase, flyTo, hexMode]);

  const enterBangladesh = useCallback(() => {
    const ms = flyTo(BD_CENTER.lat, BD_CENTER.lng, 0.24);
    window.setTimeout(() => onPhaseChange("bangladesh"), ms);
  }, [flyTo, onPhaseChange]);

  const polygonColor = useCallback(
    (feat: object) => {
      const f = feat as Feature;
      const id = f.properties.districtId;
      if (phase === "world") return "rgba(124, 111, 240, 0.9)";
      if (!hasData(id)) return "rgba(45, 52, 72, 0.55)";
      const v = values.get(id);
      if (v === undefined) return "rgba(45, 52, 72, 0.55)";
      const base = rampColor(variable, normalize(v, bounds.min, bounds.max), 0.86);
       return hovered === id ? "rgba(157, 78, 255, 0.97)" : base;
    },
    [values, bounds, variable, hovered, phase],
  );

  const polygonAltitude = useCallback(
    (f: object) =>
      phase === "world" ? 0.02 : hovered === (f as Feature).properties.districtId ? 0.035 : 0.012,
    [phase, hovered],
  );

  const hexBounds = useMemo(() => {
    const vals = gridPoints.map((p) => p.value);
    return vals.length
      ? { min: Math.min(...vals), max: Math.max(...vals) }
      : { min: 0, max: 1 };
  }, [gridPoints]);

  const [view, setView] = useState<"side" | "tilt" | "top">("tilt");
  const [spin, setSpin] = useState(false);
  const [showNames, setShowNames] = useState(true);
  const pillarHeight = useCallback(
    (value: number) => 0.018 + 0.19 * normalize(value, hexBounds.min, hexBounds.max),
    [hexBounds],
  );
  // Keep one district name per pillar, then retain a geographically distributed subset.
  // Every pillar remains identifiable through its hover label; this prevents unreadable name piles.
  const districtLabels = useMemo(() => {
    if (!gridPoints.length) return [];
    const candidates = districts.flatMap((d) => {
      let best = gridPoints[0]!;
      let bestDist = Infinity;
      for (const p of gridPoints) {
        const dist = (p.lat - d.lat) ** 2 + (p.lng - d.lon) ** 2;
        if (dist < bestDist) { bestDist = dist; best = p; }
      }
      if (bestDist > 0.36) return [];
      return [{
        districtId: d.id,
        districtLat: d.lat,
        districtLng: d.lon,
        lat: best.lat,
        lng: best.lng,
        text: lang === "bn" ? d.bn : d.name,
        alt: pillarHeight(best.value) + 0.008,
        value: best.value,
        distance: bestDist,
      }];
    });

    const nearestPerPillar = new Map<string, (typeof candidates)[number]>();
    for (const candidate of candidates) {
      const key = `${candidate.lat.toFixed(4)},${candidate.lng.toFixed(4)}`;
      const current = nearestPerPillar.get(key);
      if (!current || candidate.distance < current.distance) nearestPerPillar.set(key, candidate);
    }

    const maxLabels = Math.max(7, Math.min(view === "side" ? 10 : 18, Math.floor(size.w / 62)));
    const minSeparation = view === "top" ? 0.48 : view === "tilt" ? 0.58 : 0.72;
    const ordered = [...nearestPerPillar.values()].sort((a, b) => {
      const priority = Number(DIVISION_CENTRES.has(b.districtId)) - Number(DIVISION_CENTRES.has(a.districtId));
      return priority || b.districtLat - a.districtLat || a.districtLng - b.districtLng;
    });
    const visible: typeof ordered = [];
    for (const candidate of ordered) {
      if (visible.length >= maxLabels) break;
      const isClear = visible.every((shown) => {
        const latGap = candidate.districtLat - shown.districtLat;
        const lngGap = (candidate.districtLng - shown.districtLng) * Math.cos((candidate.districtLat * Math.PI) / 180);
        return Math.hypot(latGap, lngGap) >= minSeparation;
      });
      if (isClear) visible.push(candidate);
    }
    return visible;
  }, [lang, gridPoints, pillarHeight, size.w, view]);
  const regionalLabels = useMemo(
    () =>
      southAsiaLocations.map((item) => ({
        id: item.id,
        lat: item.lat,
        lng: item.lon,
        text: lang === "bn" ? item.bn : item.name,
      })),
    [lang],
  );

  // Aim at Bangladesh instead of the globe's centre so low camera angles keep the data in frame.
  useEffect(() => {
    if (!hexMode) return;
    const g = globeRef.current;
    if (!g) return;
    const viewSettings = {
      top: { outward: 52, tangent: 0 },
      tilt: { outward: 52, tangent: 18 },
      side: { outward: 52, tangent: 32 },
    } as const;
    const targetCoords = g.getCoords(BD_CENTER.lat, BD_CENTER.lng, 0.035);
    const southCoords = g.getCoords(BD_CENTER.lat - 2, BD_CENTER.lng, 0.035);
    const target = new Vector3(targetCoords.x, targetCoords.y, targetCoords.z);
    const outward = target.clone().normalize();
    const south = new Vector3(southCoords.x, southCoords.y, southCoords.z);
    const tangent = south.sub(target).normalize();
    const setting = viewSettings[view];
    const destination = target
      .clone()
      .addScaledVector(outward, setting.outward)
      .addScaledVector(tangent, setting.tangent);
    const camera = g.camera();
    const controls = g.controls() as {
      target: Vector3;
      autoRotate: boolean;
      autoRotateSpeed: number;
      minDistance: number;
      maxDistance: number;
      update: () => void;
    };
    camera.position.copy(destination);
    camera.lookAt(target);
    controls.target.copy(target);
    controls.minDistance = 30;
    controls.maxDistance = 180;
    controls.autoRotate = spin && !prefersReducedMotion();
    controls.autoRotateSpeed = 0.7;
    controls.update();
    return () => {
      controls.autoRotate = false;
    };
  }, [hexMode, view, spin, size]);

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden">
      <Globe
        ref={globeRef as React.MutableRefObject<GlobeMethods | undefined>}
        width={size.w}
        height={size.h}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="/textures/earth-blue-marble.jpg"
        bumpImageUrl="/textures/earth-topology.png"
        atmosphereColor="#2EE6D6"
        atmosphereAltitude={0.18}
        showGraticules={phase === "world"}
        showAtmosphere
        polygonsData={!hexMode ? features : EMPTY}
        polygonGeoJsonGeometry={(f: object) => (f as Feature).geometry as never}
        polygonCapColor={polygonColor}
        polygonSideColor={sideColor}
        polygonStrokeColor={strokeColor}
        polygonAltitude={polygonAltitude}
        polygonCapCurvatureResolution={10}
        polygonsTransitionDuration={0}
        polygonLabel={(f: object) => {
          if (phase === "world") return `<div class="globe-tooltip globe-tooltip-active"><strong>${lang === "bn" ? "বাংলাদেশ — ক্লিক করুন" : "Bangladesh — click to enter"}</strong></div>`;
          const id = (f as Feature).properties.districtId;
          const d = districts.find((x) => x.id === id);
          const v = values.get(id);
          const name = lang === "bn" && d ? d.bn : (d?.name ?? id);
          return `<div class="globe-tooltip">
            <strong>${name}</strong><br/>
            ${
              v === undefined
                ? t("district.nodata")
                : `${t(VARIABLE_LABEL_KEY[variable])}: ${fmt(v, lang, 2)}`
            }
          </div>`;
        }}
        onPolygonHover={(f: object | null) =>
          phase === "world" ? undefined : setHovered(f ? (f as Feature).properties.districtId : null)
        }
        onPolygonClick={(f: object) => (phase === "world" ? enterBangladesh() : onSelectDistrict((f as Feature).properties.districtId))}
        onGlobeClick={({ lat, lng }: { lat: number; lng: number }) => {
          if (phase === "world" && lat > 20 && lat < 27 && lng > 88 && lng < 93) enterBangladesh();
        }}
        labelsData={
          phase === "world"
            ? regionalMode
              ? regionalLabels
              : WORLD_LABELS
            : hexMode && showNames
              ? districtLabels
              : EMPTY
        }
        labelLat={(d: object) => (d as { lat: number }).lat}
        labelLng={(d: object) => (d as { lng: number }).lng}
        labelText={(d: object) => (d as { text: string }).text}
        labelSize={(d: object) =>
          phase === "world"
            ? regionalMode && (d as { id?: string }).id === "bangladesh"
              ? 1.4
              : 1.1
            : 0.1
        }
        labelDotRadius={(d: object) =>
          phase === "world"
            ? regionalMode && (d as { id?: string }).id === "bangladesh"
              ? 0.42
              : 0.26
            : hexMode ? 0 : 0.03
        }
        labelAltitude={(d: object) => phase === "world" ? 0.002 : hexMode ? ((d as { alt?: number }).alt ?? 0.2) : 0.095}
        labelColor={(d: object) => {
          if (phase === "world") {
            if (!regionalMode) return "#B17AFF";
            const id = (d as { id?: string }).id;
            if (id === "bangladesh") return "#FFFFFF";
            return id === selectedRegionalId ? "#7C6FF0" : "#2EE6D6";
          }
          return "rgba(238,246,248,0.95)";
        }}
        labelResolution={2}
        labelLabel={(d: object) => {
          if (phase !== "world") return "";
          const item = d as { id?: string; text: string };
          if (item.id && item.id !== "bangladesh") {
            return `<div class="globe-tooltip"><strong>${item.text}</strong><br/>${lang === "bn" ? "তুলনা দেখতে ক্লিক করুন" : "Click to compare"}</div>`;
          }
          if (item.id === "bangladesh") {
            return `<div class="globe-tooltip globe-tooltip-active"><strong>${lang === "bn" ? "বাংলাদেশ — ক্লিক করুন" : "Bangladesh — click to enter"}</strong></div>`;
          }
          return "";
        }}
        onLabelClick={(d: object) => {
          if (phase !== "world") return;
          const id = (d as { id?: string }).id;
          if (id && id !== "bangladesh") onSelectRegional?.(id);
          else enterBangladesh();
        }}
        ringsData={phase === "world" ? WORLD_RINGS : EMPTY}
        hexBinPointsData={hexMode ? gridPoints : EMPTY}
        hexBinPointLat={(p: object) => (p as { lat: number }).lat}
        hexBinPointLng={(p: object) => (p as { lng: number }).lng}
        hexBinPointWeight={(p: object) => (p as { value: number }).value}
        hexBinResolution={4}
        hexMargin={0.12}
        hexTopColor={(bin: object) => {
          const b = bin as { sumWeight: number; points: unknown[] };
          const mean = b.sumWeight / Math.max(1, b.points.length);
          return spectralColor(variable, normalize(mean, hexBounds.min, hexBounds.max), 0.95);
        }}
        hexSideColor={(bin: object) => {
          const b = bin as { sumWeight: number; points: unknown[] };
          const mean = b.sumWeight / Math.max(1, b.points.length);
          return spectralColor(variable, normalize(mean, hexBounds.min, hexBounds.max), 0.55);
        }}
        hexAltitude={(bin: object) => {
          const b = bin as { sumWeight: number; points: unknown[] };
          const mean = b.sumWeight / Math.max(1, b.points.length);
          return pillarHeight(mean);
        }}
        hexLabel={(bin: object) => {
          const b = bin as { sumWeight: number; points: { lat: number; lng: number; sig?: boolean }[] };
          const n = Math.max(1, b.points.length);
          const mean = b.sumWeight / n;
          const lat = b.points.reduce((sum, p) => sum + p.lat, 0) / n;
          const lng = b.points.reduce((sum, p) => sum + p.lng, 0) / n;
          const d = b.points.length ? nearestDistrict(lat, lng) : undefined;
          const name = d ? (lang === "bn" ? d.bn : d.name) : "—";
          const share = Math.round(normalize(mean, hexBounds.min, hexBounds.max) * 100);
          const sigKnown = b.points.some((p) => p.sig !== undefined);
          const sig = sigKnown ? b.points.some((p) => p.sig) : undefined;
          const L = (en: string, bn: string) => (lang === "bn" ? bn : en);
          return `<div class="globe-tooltip">
            <strong>${L("Nearest district", "নিকটতম জেলা")}: ${name}</strong><br/>
            ${t(VARIABLE_LABEL_KEY[variable])}${gridCaption ? ` · ${gridCaption}` : ""}<br/>
            <strong>${fmt(mean, lang, 2)} ${gridUnit}</strong>${n > 1 ? ` (${L(`mean of ${n} cells`, `${n}টি কোষের গড়`)})` : ""}<br/>
            ${sig === undefined ? "" : `${sig ? L("Significant trend (p &lt; 0.05)", "তাৎপর্যপূর্ণ প্রবণতা (p &lt; ০.০৫)") : L("Not statistically significant", "পরিসংখ্যানগতভাবে তাৎপর্যপূর্ণ নয়")}<br/>`}
            ${L("Pillar height", "পিলারের উচ্চতা")}: ${share}% ${L("of map range", "মানচিত্রের পরিসরের")}<br/>
            <span style="opacity:.7">${lat.toFixed(2)}°N ${lng.toFixed(2)}°E · NASA</span>
          </div>`;
        }}
        ringLat={(d: object) => (d as { lat: number }).lat}
        ringLng={(d: object) => (d as { lng: number }).lng}
        ringColor={ringColorFn}
        ringMaxRadius={6}
        ringPropagationSpeed={1.4}
        ringRepeatPeriod={prefersReducedMotion() ? 0 : 900}
      />

      {hexMode && (
        <>
        <div className="pointer-events-none absolute left-3 top-3 rounded-md border border-border bg-card/90 px-2.5 py-2 text-foreground shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-primary" aria-hidden="true">N ↑</span>
            <span className="text-[10px] text-muted-foreground">20.5–26.5°N · 88–93°E</span>
          </div>
          <p className="mt-0.5 text-[9px] text-muted-foreground">
            {lang === "bn" ? "পিলার তার নমুনা স্থানাঙ্কেই স্থাপিত" : "Pillars follow their sample coordinates"}
          </p>
        </div>
        <div className="absolute right-3 top-3 flex flex-col gap-1.5">
          {([
            ["side", lang === "bn" ? "পাশ থেকে" : "Side view"],
            ["tilt", lang === "bn" ? "৩D কোণ" : "3D tilt"],
            ["top", lang === "bn" ? "উপর থেকে" : "Top view"],
          ] as const).map(([k, label]) => (
            <Button
              key={k}
              type="button"
              size="sm"
              variant={view === k ? "default" : "outline"}
              aria-pressed={view === k}
              onClick={() => setView(k)}
              className="bg-card/90"
            >
              {label}
            </Button>
          ))}
          <Button
            type="button"
            size="sm"
            variant={spin ? "default" : "outline"}
            aria-pressed={spin}
            onClick={() => setSpin((s) => !s)}
            className="bg-card/90"
          >
            {lang === "bn" ? "৩৬০° ঘোরান" : "Spin 360°"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            aria-pressed={showNames}
            onClick={() => setShowNames((s) => !s)}
            className="bg-card/90"
          >
            {showNames ? (lang === "bn" ? "নাম লুকান" : "Hide names") : lang === "bn" ? "নাম দেখান" : "Show names"}
          </Button>
          <p className="max-w-[9rem] rounded-md bg-card/80 px-2 py-1 text-[10px] text-muted-foreground">
            {lang === "bn" ? `${districtLabels.length}টি নাম দেখানো · পিলারে ধরলে পূর্ণ তথ্য` : `${districtLabels.length} labels shown · hover pillars for details`}
          </p>
        </div>
        </>
      )}

      {phase === "world" ? (
        <Button
          type="button"
          onClick={enterBangladesh}
          className="cta-pulse absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full px-5"
        >
          {t("hero.enter")}
        </Button>
      ) : hexMode ? null : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPhaseChange("world")}
          className="absolute left-3 top-3 bg-card/90"
        >
          ← {t("globe.back")}
        </Button>
      )}
    </div>
  );
}
