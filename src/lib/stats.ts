/**
 * Real trend statistics: Mann-Kendall test and Theil-Sen slope estimator.
 * Deterministic numeric code — no model, no LLM, ever touches these numbers.
 * Mirrors scripts/backend/stats.py (numpy/scipy reference implementation).
 */

export interface MannKendall {
  s: number;
  var_s: number;
  z: number;
  p_value: number;
  tau: number;
  direction: "increasing" | "decreasing" | "no trend";
  significant_at_0_05: boolean;
}

export interface SenSlope {
  slope_per_year: number;
  slope_per_decade: number;
  intercept: number;
  ci_low: number;
  ci_high: number;
}

export interface TrendResult {
  n_observations: number;
  period: { start: number; end: number };
  current_value: number | null;
  first_value: number | null;
  trend: MannKendall;
  slope: SenSlope;
}

/** Abramowitz & Stegun 7.1.26 complementary error function. */
function erfc(x: number): number {
  const z = Math.abs(x);
  const t = 1 / (1 + z / 2);
  const r =
    t *
    Math.exp(
      -z * z -
        1.26551223 +
        t *
          (1.00002368 +
            t *
              (0.37409196 +
                t *
                  (0.09678418 +
                    t *
                      (-0.18628806 +
                        t *
                          (0.27886807 +
                            t *
                              (-1.13520398 +
                                t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))),
    );
  return x >= 0 ? r : 2 - r;
}

/** Two-sided p-value of the standard normal statistic z. */
export function normalTwoSidedP(z: number): number {
  return erfc(Math.abs(z) / Math.SQRT2);
}

function median(values: number[]): number {
  if (values.length === 0) return Number.NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

export function mannKendall(values: number[]): MannKendall {
  const n = values.length;
  let s = 0;
  for (let k = 0; k < n - 1; k += 1) {
    for (let j = k + 1; j < n; j += 1) {
      s += Math.sign(values[j]! - values[k]!);
    }
  }

  // Variance with tie correction.
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let tieTerm = 0;
  for (const c of counts.values()) {
    if (c > 1) tieTerm += c * (c - 1) * (2 * c + 5);
  }
  const varS = (n * (n - 1) * (2 * n + 5) - tieTerm) / 18;

  let z = 0;
  if (varS > 0) {
    if (s > 0) z = (s - 1) / Math.sqrt(varS);
    else if (s < 0) z = (s + 1) / Math.sqrt(varS);
  }
  const p = varS > 0 ? normalTwoSidedP(z) : 1;
  const significant = p < 0.05;
  const tau = n > 1 ? (2 * s) / (n * (n - 1)) : 0;

  return {
    s,
    var_s: varS,
    z,
    p_value: p,
    tau,
    direction: significant ? (s > 0 ? "increasing" : "decreasing") : "no trend",
    significant_at_0_05: significant,
  };
}

/** Theil-Sen slope with Sen's 95% confidence interval. */
export function theilSen(years: number[], values: number[]): SenSlope {
  const slopes: number[] = [];
  for (let i = 0; i < values.length - 1; i += 1) {
    for (let j = i + 1; j < values.length; j += 1) {
      const dx = years[j]! - years[i]!;
      if (dx !== 0) slopes.push((values[j]! - values[i]!) / dx);
    }
  }
  const sorted = slopes.sort((a, b) => a - b);
  const slope = median(sorted);
  const intercept = median(values) - slope * median(years);

  const { var_s: varS } = mannKendall(values);
  // z_{0.975} = 1.959964
  const cAlpha = 1.959964 * Math.sqrt(varS);
  const nSlopes = sorted.length;
  const lowerIdx = Math.max(0, Math.round((nSlopes - cAlpha) / 2) - 1);
  const upperIdx = Math.min(nSlopes - 1, Math.round((nSlopes + cAlpha) / 2));

  return {
    slope_per_year: slope,
    slope_per_decade: slope * 10,
    intercept,
    ci_low: sorted[lowerIdx] ?? slope,
    ci_high: sorted[upperIdx] ?? slope,
  };
}

export function analyzeSeries(points: { year: number; value: number }[]): TrendResult | null {
  const clean = points
    .filter((p) => Number.isFinite(p.value))
    .sort((a, b) => a.year - b.year);
  if (clean.length < 5) return null;
  const years = clean.map((p) => p.year);
  const values = clean.map((p) => p.value);
  return {
    n_observations: clean.length,
    period: { start: years[0]!, end: years[years.length - 1]! },
    current_value: values[values.length - 1]!,
    first_value: values[0]!,
    trend: mannKendall(values),
    slope: theilSen(years, values),
  };
}

/** Points on the fitted Theil-Sen line, for chart overlays. */
export function senLine(slope: SenSlope, years: number[]) {
  return years.map((year) => ({
    year,
    fit: slope.intercept + slope.slope_per_year * year,
    ciLow: slope.intercept + slope.ci_low * year,
    ciHigh: slope.intercept + slope.ci_high * year,
  }));
}

/* ---------- Ordinary least squares with Student-t significance ---------- */

function logGamma(x: number): number {
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x;
  const tmp = x + 5.5 - (x + 0.5) * Math.log(x + 5.5);
  let ser = 1.000000000190015;
  for (const ci of c) ser += ci / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}
function betacf(a: number, b: number, x: number): number {
  let c = 1, d = 1 - ((a + b) * x) / (a + 1);
  if (Math.abs(d) < 1e-30) d = 1e-30;
  d = 1 / d; let h = d;
  for (let m = 1; m <= 200; m += 1) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((a - 1 + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d; h *= d * c;
    aa = (-(a + m) * (a + b + m) * x) / ((a + m2) * (a + 1 + m2));
    d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d; const del = d * c; h *= del;
    if (Math.abs(del - 1) < 3e-12) break;
  }
  return h;
}
function incompleteBeta(a: number, b: number, x: number): number {
  if (x <= 0) return 0; if (x >= 1) return 1;
  const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? (bt * betacf(a, b, x)) / a : 1 - (bt * betacf(b, a, 1 - x)) / b;
}
/** Two-sided p-value for a Student t statistic with df degrees of freedom. */
export function studentTwoSidedP(t: number, df: number): number {
  if (!Number.isFinite(t)) return 0;
  return incompleteBeta(df / 2, 0.5, df / (df + t * t));
}
/** Critical t value for a two-sided 95% interval (bisection on the CDF). */
export function tCritical95(df: number): number {
  let lo = 0, hi = 50;
  for (let i = 0; i < 80; i += 1) { const mid = (lo + hi) / 2; if (studentTwoSidedP(mid, df) > 0.05) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}

export interface LinearTrend {
  slope_per_year: number;
  slope_per_decade: number;
  intercept: number;
  r_squared: number;
  standard_error: number;
  t_statistic: number;
  degrees_of_freedom: number;
  p_value: number;
  ci95_low_per_decade: number;
  ci95_high_per_decade: number;
  significant_at_0_05: boolean;
}

/** OLS slope, t-test on the slope, and 95% confidence interval. Needs ≥ 3 points. */
export function linearRegression(years: number[], values: number[]): LinearTrend | null {
  const n = years.length;
  if (n < 3 || values.length !== n) return null;
  const mx = years.reduce((a, b) => a + b, 0) / n;
  const my = values.reduce((a, b) => a + b, 0) / n;
  let sxx = 0, sxy = 0, syy = 0;
  for (let i = 0; i < n; i += 1) { const dx = years[i]! - mx, dy = values[i]! - my; sxx += dx * dx; sxy += dx * dy; syy += dy * dy; }
  if (sxx === 0) return null;
  const slope = sxy / sxx, intercept = my - slope * mx;
  let sse = 0;
  for (let i = 0; i < n; i += 1) { const r = values[i]! - (intercept + slope * years[i]!); sse += r * r; }
  const df = n - 2;
  const se = Math.sqrt(sse / df / sxx);
  const t = se === 0 ? (slope === 0 ? 0 : Infinity) : slope / se;
  const p = se === 0 ? (slope === 0 ? 1 : 0) : studentTwoSidedP(t, df);
  const tc = tCritical95(df);
  return {
    slope_per_year: slope, slope_per_decade: slope * 10, intercept,
    r_squared: syy === 0 ? 0 : 1 - sse / syy,
    standard_error: se, t_statistic: t, degrees_of_freedom: df, p_value: p,
    ci95_low_per_decade: (slope - tc * se) * 10, ci95_high_per_decade: (slope + tc * se) * 10,
    significant_at_0_05: p < 0.05,
  };
}
