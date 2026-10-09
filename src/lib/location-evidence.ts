import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useEffect, useState } from 'react';
import { loadLocationEvidence } from './global-climate.functions';
import { registerEvidence } from './climate';
export function useLocationEvidence(id: string, includeModis = false) {
 const load = useServerFn(loadLocationEvidence);
 const query = useQuery({queryKey:['location-evidence',id,includeModis],queryFn:() => load({data:{id,includeModis}}),enabled:id.startsWith('g_'),staleTime:86400000,retry:false});
 const [version,setVersion] = useState(0);
 const [hydrated,setHydrated] = useState(false);
 useEffect(()=>setHydrated(true),[]);
 useEffect(() => { if(query.data) {registerEvidence(query.data.location,query.data.document);setVersion(v=>v+1);} },[query.data]);
 return {...query,version,hydrated};
}
