import { useEffect, useMemo, useRef, useState } from 'react';
import Globe, { type GlobeMethods } from 'react-globe.gl';
import { AmbientLight, DirectionalLight } from 'three';
import { Globe2, Grid2X2, MapPin, Minus, Moon, Pause, Play, Plus, RotateCcw, Sun } from 'lucide-react';
import { districts, getSeries, registerEvidence, getCached, type VariableKey } from '@/lib/climate';
import { coordinateLocation, coordinatesLabel } from '@/lib/global-locations';
import { useLang } from '@/lib/i18n';
import { normalize, spectralColor } from '@/lib/colors';
import { Button } from './ui/button';
import dayAsset from '@/assets/earth/earth-day.jpg.asset.json';
import nightAsset from '@/assets/earth/earth-night.jpg.asset.json';
import topologyAsset from '@/assets/earth/earth-topology.png.asset.json';

export interface GlobeExplorerProps {
  variable: VariableKey; phase: 'world' | 'bangladesh'; onPhaseChange: (phase: 'world' | 'bangladesh') => void; onSelectDistrict: (id: string) => void;
  hexMode?: boolean; gridPoints?: { lat: number; lng: number; value: number; sig?: boolean }[]; gridUnit?: string; gridCaption?: string;
  regionalMode?: boolean; selectedRegionalId?: string; onSelectRegional?: (id: string) => void;
}

// Canvas conversion lets Three.js consume the same semantic colors as the UI.
function readColor(token: string) {
  const canvas = document.createElement('canvas'); canvas.width = 1; canvas.height = 1;
  const ctx = canvas.getContext('2d'); if (!ctx) return '';
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  ctx.fillRect(0, 0, 1, 1); const p = ctx.getImageData(0, 0, 1, 1).data;
  return `rgba(${p[0]},${p[1]},${p[2]},${p[3] / 255})`;
}
const escapeHtml = (text: string) => text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c));

export default function GlobeExplorer({ variable, onSelectDistrict, hexMode = false, gridPoints = [], gridUnit = '', gridCaption = '', regionalMode = false, selectedRegionalId, onSelectRegional }: GlobeExplorerProps) {
  const ref = useRef<GlobeMethods | undefined>(undefined); const wrap = useRef<HTMLDivElement>(null); const { lang } = useLang();
  const [size, setSize] = useState({ w: 320, h: 440 });
  const [ready, setReady] = useState(false); const [spin, setSpin] = useState(false); const [names, setNames] = useState(false);
  const [night, setNight] = useState(false); const [graticules, setGraticules] = useState(false);
  const [colors, setColors] = useState({ pin: '', atmosphere: '', light: '' });
  const L = (en: string, bn: string) => lang === 'bn' ? bn : en;
  useEffect(() => {
    const update = () => setColors({ pin: readColor('--globe-pin'), atmosphere: readColor('--globe-atmosphere'), light: readColor('--globe-light') });
    update(); const observer = new MutationObserver(update); observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const resize = () => setSize({ w: Math.max(1, Math.floor(el.clientWidth)), h: Math.max(1, Math.floor(el.clientHeight)) });
    const ro = new ResizeObserver(resize); ro.observe(el); resize(); return () => ro.disconnect();
  }, []);
  useEffect(() => { if (!ready) return; setSpin(!matchMedia('(prefers-reduced-motion: reduce)').matches); }, [ready]);
  useEffect(() => {
    const g = ref.current; if (!g || !ready) return;
    const controls = g.controls() as { autoRotate: boolean; autoRotateSpeed: number; enableDamping: boolean; dampingFactor: number; minDistance: number; maxDistance: number };
    controls.autoRotate = spin; controls.autoRotateSpeed = .28; controls.enableDamping = true; controls.dampingFactor = .08; controls.minDistance = 130; controls.maxDistance = 600;
  }, [spin, ready]);
  useEffect(() => {
    const g = ref.current; if (!g || !ready || !colors.light) return;
    const sun = new DirectionalLight(colors.light, night ? .7 : 2.1); sun.position.set(-100, 180, 300);
    g.lights([new AmbientLight(colors.light, night ? 1.1 : 1.6), sun]);
  }, [ready, night, colors.light]);
  const points = useMemo(() => districts.filter(x => x.id.startsWith('g_') || ['bangladesh', 'india', 'pakistan', 'nepal', 'bhutan', 'sri-lanka', 'afghanistan', 'maldives', 'myanmar'].includes(x.id)).map(x => ({ id: x.id, lat: x.lat, lng: x.lon, name: lang === 'bn' ? x.bn : x.name, value: getSeries(x.id, variable).at(-1)?.value })), [variable, lang]);
  const selected = points.filter(p => p.id === selectedRegionalId);
  const bounds = useMemo(() => { const values = gridPoints.map(x => x.value); return values.length ? { min: Math.min(...values), max: Math.max(...values) } : { min: 0, max: 1 }; }, [gridPoints]);
  function select(lat: number, lon: number) { const location = coordinateLocation(lat, lon); registerEvidence(location, getCached(location.id) ?? { district: location.id, variables: {} }); onSelectDistrict(location.id); }
  function home() { ref.current?.pointOfView({ lat: 18, lng: 25, altitude: size.w < 600 ? 2.25 : 1.85 }, 800); }
  function zoom(factor: number) { const g = ref.current; if (!g) return; const pov = g.pointOfView(); g.pointOfView({ ...pov, altitude: Math.min(4.8, Math.max(.35, pov.altitude * factor)) }, 350); }
  const tooltip = (p: { name?: string; lat: number; lng: number; value?: number | undefined }) => `<div class="globe-tooltip"><strong>${escapeHtml(p.name ?? coordinatesLabel(p.lat, p.lng))}</strong><br/>${escapeHtml(p.value === undefined || !gridUnit ? L('Open NASA evidence', 'NASA তথ্য খুলুন') : `${p.value.toFixed(2)} ${gridUnit}`)}${gridCaption ? `<br/>${escapeHtml(gridCaption)}` : ''}</div>`;
  return <div ref={wrap} className="earth-stage relative h-full w-full">
    <div className="earth-stage-caption"><Globe2 aria-hidden /><span>{L('EARTH EXPLORER', 'পৃথিবী অনুসন্ধান')}</span><span className="earth-live-dot" aria-hidden /></div>
    <Globe ref={ref} width={size.w} height={size.h} backgroundColor="rgba(0,0,0,0)"
      globeImageUrl={night ? nightAsset.url : dayAsset.url} bumpImageUrl={topologyAsset.url}
      showAtmosphere atmosphereColor={colors.atmosphere || undefined} atmosphereAltitude={.17} showGraticules={graticules}
      onGlobeReady={() => { setReady(true); home(); }} onGlobeClick={({ lat, lng }) => select(lat, lng)}
      pointsData={hexMode ? [] : points} pointLat="lat" pointLng="lng" pointAltitude={.003} pointRadius={.18}
      pointColor={() => colors.pin} pointLabel={p => tooltip(p as typeof points[number])}
      onPointClick={p => { const id = (p as typeof points[number]).id; regionalMode ? onSelectRegional?.(id) : onSelectDistrict(id); }}
      labelsData={names && !hexMode ? points : []} labelLat="lat" labelLng="lng" labelText="name" labelSize={.55} labelDotRadius={.12} labelColor={() => colors.pin}
      onLabelClick={p => { const id = (p as typeof points[number]).id; regionalMode ? onSelectRegional?.(id) : onSelectDistrict(id); }}
      ringsData={regionalMode && !hexMode ? selected : []} ringLat="lat" ringLng="lng" ringColor={() => colors.pin} ringMaxRadius={2} ringPropagationSpeed={1} ringRepeatPeriod={1800}
      hexBinPointsData={hexMode ? gridPoints : []} hexBinPointLat="lat" hexBinPointLng="lng" hexBinPointWeight="value" hexBinResolution={4} hexMargin={.15}
      hexTopColor={b => { const x = b as { sumWeight: number; points: unknown[] }; return spectralColor(variable, normalize(x.sumWeight / Math.max(1, x.points.length), bounds.min, bounds.max), .95); }}
      hexSideColor={b => { const x = b as { sumWeight: number; points: unknown[] }; return spectralColor(variable, normalize(x.sumWeight / Math.max(1, x.points.length), bounds.min, bounds.max), .5); }}
      hexAltitude={b => { const x = b as { sumWeight: number; points: unknown[] }; return .02 + .15 * normalize(x.sumWeight / Math.max(1, x.points.length), bounds.min, bounds.max); }}
      hexLabel={b => { const x = b as { sumWeight: number; points: { lat: number; lng: number; sig?: boolean }[] }; const p = x.points[0]; return p ? tooltip({ ...p, value: x.sumWeight / Math.max(1, x.points.length) }) : ''; }}
      onHexClick={b => { const p = (b as { points: { lat: number; lng: number }[] }).points[0]; if (p) select(p.lat, p.lng); }} />
    <div className="earth-toolbar" role="toolbar" aria-label={L('Earth view', 'পৃথিবীর দৃশ্য')}>
      <Button variant="ghost" size="icon" title={L('Reset view', 'দৃশ্য ফিরিয়ে আনুন')} aria-label={L('Reset view', 'দৃশ্য ফিরিয়ে আনুন')} onClick={home}><RotateCcw /></Button>
      <Button variant="ghost" size="icon" title={L('Zoom in', 'বড় করুন')} aria-label={L('Zoom in', 'বড় করুন')} onClick={() => zoom(.8)}><Plus /></Button>
      <Button variant="ghost" size="icon" title={L('Zoom out', 'ছোট করুন')} aria-label={L('Zoom out', 'ছোট করুন')} onClick={() => zoom(1.25)}><Minus /></Button>
      <span className="earth-toolbar-divider" />
      <Button variant={spin ? 'secondary' : 'ghost'} size="icon" title={L(spin ? 'Pause rotation' : 'Rotate Earth', spin ? 'ঘোরানো থামান' : 'পৃথিবী ঘোরান')} aria-label={L(spin ? 'Pause rotation' : 'Rotate Earth', spin ? 'ঘোরানো থামান' : 'পৃথিবী ঘোরান')} aria-pressed={spin} onClick={() => setSpin(x => !x)}>{spin ? <Pause /> : <Play />}</Button>
      <Button variant={night ? 'secondary' : 'ghost'} size="icon" title={L(night ? 'Daylight' : 'City lights', night ? 'দিনের আলো' : 'শহরের আলো')} aria-label={L(night ? 'Daylight' : 'City lights', night ? 'দিনের আলো' : 'শহরের আলো')} aria-pressed={night} onClick={() => setNight(x => !x)}>{night ? <Sun /> : <Moon />}</Button>
      <Button variant={graticules ? 'secondary' : 'ghost'} size="icon" title={L('Coordinate grid', 'স্থানাঙ্ক জাল')} aria-label={L('Coordinate grid', 'স্থানাঙ্ক জাল')} aria-pressed={graticules} onClick={() => setGraticules(x => !x)}><Grid2X2 /></Button>
      {!hexMode && <Button variant={names ? 'secondary' : 'ghost'} size="icon" title={L('Place names', 'স্থানের নাম')} aria-label={L('Place names', 'স্থানের নাম')} aria-pressed={names} onClick={() => setNames(x => !x)}><MapPin /></Button>}
    </div>
  </div>;
}
