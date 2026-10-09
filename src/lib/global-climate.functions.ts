import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { coordinateLocation, globalLocations } from './global-locations';
export const loadLocationEvidence = createServerFn({method:'GET'})
 .inputValidator((input) => z.object({id:z.string().min(1).max(100),includeModis:z.boolean().optional()}).parse(input))
 .handler(async ({data}) => { const {ensureGlobalEvidence} = await import('./global-climate.server'); return ensureGlobalEvidence(data.id,data.includeModis); });
export const searchWorldwide = createServerFn({method:'GET'})
 .inputValidator((input) => z.object({query:z.string().trim().min(2).max(100)}).parse(input))
 .handler(async ({data}) => {
   const local = globalLocations.filter(x => x.name.toLowerCase().includes(data.query.toLowerCase())).slice(0,5);
   try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?${new URLSearchParams({name:data.query,count:'10',language:'en',format:'json'})}`;
    const response = await fetch(url); if (!response.ok) return {locations:local,error:'City search is temporarily unavailable. Country search remains available.'};
    const payload = await response.json() as {results?:{name:string;latitude:number;longitude:number;country?:string;admin1?:string;population?:number}[]};
    const cities = (payload.results ?? []).sort((a,b)=>Number(b.name.toLowerCase()===data.query.toLowerCase())-Number(a.name.toLowerCase()===data.query.toLowerCase()) || (b.population??0)-(a.population??0)).filter(x => Number.isFinite(x.latitude) && Number.isFinite(x.longitude)).map(x => ({...coordinateLocation(x.latitude,x.longitude,x.name,x.country),division:[x.admin1,x.country].filter(Boolean).join(', ')}));
    return {locations:[...local,...cities],error:null};
   } catch { return {locations:local,error:'City search is temporarily unavailable. Country search remains available.'}; }
 });
