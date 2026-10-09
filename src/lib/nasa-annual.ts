/** Reject fill values and incomplete years, matching our cached NASA ingestion rules. */
export function annualMonthly(series: Record<string, number>, start = 2015, end = 2024): Record<string, number> {
  const grouped = new Map<number, Map<number, number>>();
  for (const [date, value] of Object.entries(series)) {
    if (!/^\d{6}$/.test(date) || !Number.isFinite(value) || value <= -900) continue;
    const year = Number(date.slice(0, 4)), month = Number(date.slice(4));
    if (year < start || year > end || month < 1 || month > 12) continue;
    const months = grouped.get(year) ?? new Map<number, number>(); months.set(month, value); grouped.set(year, months);
  }
  return Object.fromEntries([...grouped].filter(([, months]) => months.size === 12).map(([year, months]) => [String(year), [...months.values()].reduce((a,b) => a+b,0) / 12]));
}
export function annualComposites(values: number[]): number | null {
  const valid = values.filter(Number.isFinite); return valid.length >= 8 ? valid.reduce((a,b) => a+b,0) / valid.length : null;
}

/** NASA AG solar units are MJ/m²/day; convert only when the source declares MJ. */
export function solarKwh(annual: Record<string,number>, sourceUnit: string) {
 return Object.fromEntries(Object.entries(annual).map(([year,value])=>[year,sourceUnit.toLowerCase().startsWith("mj") ? value/3.6 : value]));
}
