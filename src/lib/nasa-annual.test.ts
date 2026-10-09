import {describe,it,expect} from 'vitest';
import {annualMonthly,annualComposites,solarKwh} from './nasa-annual';
import {coordinateLocation,parseGlobalLocation} from './global-locations';
describe('worldwide evidence rules',()=>{
 it('supports southern and western coordinates with stable location IDs',()=>{const p=coordinateLocation(-33.9249,-18.4241,'Cape Town');const r=parseGlobalLocation(p.id);expect(r?.lat).toBe(-33.9249);expect(r?.lon).toBe(-18.4241);});
 it('rejects out-of-world coordinates',()=>{expect(parseGlobalLocation('g_91.0000_10.0000_point')).toBeUndefined();expect(parseGlobalLocation('g_10.0000_181.0000_point')).toBeUndefined();});
 it('requires all twelve valid months before an annual POWER value',()=>{const months=Object.fromEntries(Array.from({length:12},(_,i)=>[`2024${String(i+1).padStart(2,'0')}`,12]));expect(annualMonthly(months)).toEqual({'2024':12});delete months['202412'];expect(annualMonthly(months)).toEqual({});});
 it('never converts NASA fill values into climate evidence',()=>{const months=Object.fromEntries(Array.from({length:12},(_,i)=>[`2024${String(i+1).padStart(2,'0')}`,12]));months['202406']=-999;expect(annualMonthly(months)).toEqual({});});
 it('converts NASA MJ solar values to their displayed kWh unit',()=>{expect(solarKwh({'2024':14.4},'MJ/m^2/day')['2024']).toBe(4);expect(solarKwh({'2024':4},'kWh/m^2/day')['2024']).toBe(4);});
 it('requires at least eight valid MODIS observations',()=>{expect(annualComposites([1,1,1,1,1,1,1])).toBeNull();expect(annualComposites([1,1,1,1,1,1,1,1])).toBe(1);});
});
