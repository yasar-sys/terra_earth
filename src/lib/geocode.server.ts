import { coordinateLocation, type GlobalLocation } from './global-locations';
/** Only resolves named place phrases; coordinates are supplied by the geocoder, never an AI model. */
export async function geocodeQuestion(text:string):Promise<GlobalLocation[]> {
 const phrases = [...text.matchAll(/(?:\bin\b|\bfor\b|\bat\b|\bcompare\b|\bwith\b|\bversus\b|\bvs\.?\b|\band\b)\s+([\p{L}][\p{L} .'-]{1,60})/giu)].map(x=>x[1]?.split(/\s+(?:and|with|versus|vs|from|between|during|over|since|temperature|rainfall|climate|trend|warming|in|for)\b/i)[0]?.trim()).filter((x):x is string=>!!x);
 const locations:GlobalLocation[]=[];
 for(const phrase of [...new Set(phrases)].slice(0,3)) {
  try {const response=await fetch(`https://geocoding-api.open-meteo.com/v1/search?${new URLSearchParams({name:phrase,count:'1',language:'en',format:'json'})}`);if(!response.ok)continue;const payload=await response.json() as {results?:{name:string;latitude:number;longitude:number;country?:string}[]};const x=payload.results?.[0];if(x && x.name.toLowerCase()===phrase.toLowerCase()) locations.push(coordinateLocation(x.latitude,x.longitude,x.name,x.country));}catch{/* explicit filters remain available */}
 }
 return locations;
}
