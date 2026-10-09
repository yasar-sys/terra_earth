import { getCached, getDistrict, registerEvidence, type CachedDistrict, type CachedVariable, type VariableKey } from './climate';
import { annualMonthly, annualComposites, solarKwh } from './nasa-annual';
import type { GlobalLocation } from './global-locations';
const START = 2015, END = 2024;
const POWER = 'https://power.larc.nasa.gov/api/temporal/monthly/point';
const MODIS = 'https://modis.ornl.gov/rst/api/v1';
const pending = new Map<string, Promise<EvidenceResponse>>();
const loaded = new Map<string, { result: EvidenceResponse; time: number }>();
export interface EvidenceResponse { location: GlobalLocation; document: CachedDistrict; warnings: string[] }
async function json(url: string): Promise<any> {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`NASA returned ${response.status}`);
  return response.json();
}
async function power(location: GlobalLocation) {
  const query = new URLSearchParams({ parameters:'T2M,ALLSKY_SFC_SW_DWN,PRECTOTCORR', community:'AG', latitude:String(location.lat), longitude:String(location.lon), start:String(START), end:String(END), format:'JSON' });
  const url = `${POWER}?${query}`; const payload = await json(url);
  const params = payload?.properties?.parameter ?? {};
  const solarUnit = payload?.parameters?.ALLSKY_SFC_SW_DWN?.units ?? "MJ/m^2/day";
  const specs = [['temperature','T2M','°C','Air temperature (2 m)'],['solar','ALLSKY_SFC_SW_DWN','kWh/m²/day','All-sky solar radiation'],['precipitation','PRECTOTCORR','mm/day','Precipitation']] as const;
  return Object.fromEntries(specs.map(([variable,key,unit,label]) => [variable,{ unit,label,annual:variable === "solar" ? solarKwh(annualMonthly(params[key] ?? {},START,END),solarUnit) : annualMonthly(params[key] ?? {},START,END), provenance:{dataset_id:'NASA_POWER_MONTHLY_AG',source_url:url,retrieved:new Date().toISOString(),mode:'cache' as const} }])) as Partial<Record<VariableKey,CachedVariable>>;
}
const PRODUCTS = {
 ndvi:{ product:'MOD13Q1',band:'250m_16_days_NDVI',scale:0.0001,offset:0,fill:-3000,unit:'NDVI',label:'Vegetation index (NDVI)' },
 lst:{ product:'MOD11A2',band:'LST_Day_1km',scale:0.02,offset:-273.15,fill:0,unit:'°C',label:'Land surface temperature (day)' },
} as const;
async function modis(location: GlobalLocation, key: 'ndvi' | 'lst'): Promise<CachedVariable> {
 const config = PRODUCTS[key]; const coords = new URLSearchParams({latitude:String(location.lat),longitude:String(location.lon)});
 const datesPayload = await json(`${MODIS}/${config.product}/dates?${coords}`);
 const byYear = new Map<number,string[]>();
 for (const item of datesPayload?.dates ?? []) {
   const date = String(item.modis_date); const year = Number(date.slice(1,5));
   if (year >= START && year <= END) { const values = byYear.get(year) ?? []; values.push(date); byYear.set(year,values); }
 }
 const jobs: {year:number; dates:string[]}[] = [];
 for (const [year, dates] of byYear) for (let i=0;i<dates.length;i+=10) jobs.push({year,dates:dates.slice(i,i+10)});
 const values = new Map<number,number[]>(); let cursor = 0;
 async function worker() {
  while (cursor < jobs.length) {
   const job = jobs[cursor++]; if (!job || !job.dates[0]) continue;
   const query = new URLSearchParams({...Object.fromEntries(coords),band:config.band,startDate:job.dates[0],endDate:job.dates[job.dates.length-1] ?? job.dates[0],kmAboveBelow:'0',kmLeftRight:'0'});
   const data = await json(`${MODIS}/${config.product}/subset?${query}`);
   const collected = values.get(job.year) ?? [];
   for (const entry of data?.subset ?? []) for (const raw of entry.data ?? []) {
     if (typeof raw !== 'number' || !Number.isFinite(raw) || raw === config.fill) continue;
     const value = raw*config.scale+config.offset;
     if (key === 'ndvi' && (value < -0.2 || value > 1)) continue;
     if (key === 'lst' && (value < -100 || value > 100)) continue;
     collected.push(value);
   }
   values.set(job.year,collected);
  }
 }
 await Promise.all(Array.from({length:4},worker));
 const annual: Record<string,number> = {};
 for (const [year,samples] of values) { const mean = annualComposites(samples); if (mean !== null) annual[String(year)] = mean; }
 return {unit:config.unit,label:config.label,annual,provenance:{dataset_id:`${config.product}.061`,source_url:`${MODIS}/${config.product}/subset?${coords}&band=${config.band}`,retrieved:new Date().toISOString(),mode:'cache'}};
}
export async function ensureGlobalEvidence(id: string, includeModis = false): Promise<EvidenceResponse> {
 const location = getDistrict(id); if (!location) throw new Error('Unknown location.');
 const existing = getCached(id);
 if (!id.startsWith('g_')) return {location,document:existing ?? {district:id,variables:{}},warnings:[]};
 const cacheKey = `${id}:${includeModis}`; const recent = loaded.get(cacheKey);
 if (recent && Date.now()-recent.time < 86400000) { registerEvidence(recent.result.location,recent.result.document); return recent.result; }
 const active = pending.get(cacheKey); if (active) return active;
 const promise = (async () => {
   const document: CachedDistrict = {district:id,variables:{...existing?.variables}}; const warnings: string[] = [];
   if (!document.variables.temperature) { try { Object.assign(document.variables,await power(location)); } catch { warnings.push('NASA POWER is temporarily unavailable for this point. No values were estimated.'); } }
   if (includeModis) await Promise.all((['ndvi','lst'] as const).map(async key => {
     if (document.variables[key]) return;
     try { document.variables[key] = await modis(location,key); } catch { warnings.push(`NASA MODIS ${key.toUpperCase()} is unavailable for this point. No values were estimated.`); }
   }));
   const result = {location,document,warnings}; registerEvidence(location,document);
   if (!warnings.length) { if (loaded.size > 128) loaded.delete(loaded.keys().next().value ?? ''); loaded.set(cacheKey,{result,time:Date.now()}); }
   return result;
 })(); pending.set(cacheKey,promise);
 try { return await promise; } finally { pending.delete(cacheKey); }
}
