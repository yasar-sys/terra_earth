import catalog from '@/data/global-locations.json';
export interface GlobalLocation { id: string; name: string; bn: string; division: string; lat: number; lon: number; country?: string; sample_type?: string }
export const globalLocations: GlobalLocation[] = catalog;
export function coordinateLocation(lat: number, lon: number, name?: string, country = ''): GlobalLocation {
  const latitude = Number(lat.toFixed(4)); const longitude = Number(lon.toFixed(4));
  const slug = (name ?? 'Selected point').normalize('NFKD').replace(/[^a-zA-Z0-9 -]/g, '').trim().replace(/\s+/g, '-').toLowerCase().slice(0, 48) || 'selected-point';
  return { id: `g_${latitude.toFixed(4)}_${longitude.toFixed(4)}_${slug}`, name: name ?? `${latitude}°, ${longitude}°`, bn: name ?? `${latitude}°, ${longitude}°`, division: country || 'World', country, lat: latitude, lon: longitude, sample_type: 'representative coordinate point' };
}
export function parseGlobalLocation(id: string): GlobalLocation | undefined {
  const known = globalLocations.find(x => x.id === id); if (known) return known;
  const match = /^g_(-?\d{1,2}\.\d{4})_(-?\d{1,3}\.\d{4})_([a-z0-9-]{1,48})$/.exec(id);
  if (!match) return;
  const lat = Number(match[1]), lon = Number(match[2]);
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return;
  const name = match[3]?.split('-').map(x => x.charAt(0).toUpperCase() + x.slice(1)).join(' ') || 'Selected point';
  return { id, name, bn: name, division: 'World', lat, lon, sample_type: 'representative coordinate point' };
}
export function coordinatesLabel(lat: number, lon: number) {
  return `${Math.abs(lat).toFixed(3)}°${lat < 0 ? 'S' : 'N'}, ${Math.abs(lon).toFixed(3)}°${lon < 0 ? 'W' : 'E'}`;
}
