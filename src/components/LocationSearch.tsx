import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { LoaderCircle, Search, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { searchWorldwide } from '@/lib/global-climate.functions';
import { registerEvidence, getCached } from '@/lib/climate';
import { globalLocations, type GlobalLocation } from '@/lib/global-locations';
import { useLang } from '@/lib/i18n';
export function LocationSearch({onSelect,label}:{onSelect:(id:string)=>void;label?:string}) {
 const {lang}=useLang(); const search=useServerFn(searchWorldwide);
 const [query,setQuery]=useState('');const [results,setResults]=useState<GlobalLocation[]>([]); const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
 async function submit(event:React.FormEvent) {event.preventDefault();if(query.trim().length<2)return;setBusy(true);setMessage('');try{const result=await search({data:{query}});setResults(result.locations);setMessage(result.error ?? (result.locations.length ? '' : lang==='bn'?'কোনো স্থান পাওয়া যায়নি।':'No places found.'));}catch{setMessage(lang==='bn'?'অনুসন্ধান এখন সম্ভব নয়।':'Search is temporarily unavailable.');}finally{setBusy(false);}}
 function choose(location:GlobalLocation){registerEvidence(location,getCached(location.id)??{district:location.id,variables:{}});onSelect(location.id);setResults([]);}
 return <div className="min-w-0"><form onSubmit={submit} className="flex items-end gap-2"><label className="min-w-0 flex-1 text-xs text-muted-foreground">{label??(lang==='bn'?'বিশ্বের দেশ বা শহর':'Country or city worldwide')}<Input aria-label={label??'Search worldwide locations'} className="mt-1" value={query} onChange={e=>{setQuery(e.target.value);const q=e.target.value.toLowerCase();setResults(q.length>1?globalLocations.filter(x=>x.name.toLowerCase().includes(q)).slice(0,5):[]);}} placeholder={lang==='bn'?'যেমন Tokyo, Kenya, London':'Tokyo, Kenya, London…'}/></label><Button type="submit" variant="outline" disabled={busy||query.trim().length<2} aria-label="Search places">{busy?<LoaderCircle className="animate-spin"/>:<Search/>}</Button></form>{busy?<p className="mt-2 text-xs text-muted-foreground" role="status">{lang==='bn'?'স্থান খোঁজা হচ্ছে…':'Searching places…'}</p>:null}{message?<p className="mt-2 text-xs text-accent" role="status">{message}</p>:null}{results.length?<ul className="mt-2 max-h-64 overflow-auto divide-y divide-border border border-border bg-card">{results.map((x,i)=><li key={`${x.id}-${i}`}><Button className="h-auto w-full justify-start whitespace-normal px-3 py-2 text-left" variant="ghost" onClick={()=>choose(x)}><MapPin className="shrink-0"/><span><strong className="block">{x.name}</strong><span className="text-xs text-muted-foreground">{x.division} · {x.lat.toFixed(2)}°, {x.lon.toFixed(2)}°</span></span></Button></li>)}</ul>:null}</div>;
}
