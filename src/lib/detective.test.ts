import { describe, it, expect } from "vitest";
import { linearRegression, studentTwoSidedP } from "./stats";
import { seasonalSeries } from "./detective";
describe("trend detective rules", () => {
  it("recovers an exact linear slope with a significant t-test", () => {
    const years = [2000, 2001, 2002, 2003, 2004, 2005];
    const r = linearRegression(years, years.map((y, i) => 0.02 * y + (i % 2 ? 0.001 : -0.001)))!;
    expect(r.slope_per_decade).toBeCloseTo(0.2, 2);
    expect(r.significant_at_0_05).toBe(true);
    expect(r.ci95_low_per_decade).toBeLessThan(r.slope_per_decade);
    expect(r.ci95_high_per_decade).toBeGreaterThan(r.slope_per_decade);
  });
  it("matches the textbook t distribution (t=2.228, df=10 → p≈0.05)", () => {
    expect(studentTwoSidedP(2.228, 10)).toBeCloseTo(0.05, 3);
  });
  it("calls a flat noisy series not significant", () => {
    const r = linearRegression([1, 2, 3, 4, 5, 6], [1, -1, 1, -1, 1, -1])!;
    expect(r.significant_at_0_05).toBe(false);
  });
  it("assigns December to the following winter and drops incomplete seasons", () => {
    const m = { "200012": 1, "200101": 2, "200102": 3, "200112": 4, "200201": 5 };
    expect(seasonalSeries(m, [12, 1, 2], 2001, 2002)).toEqual([{ year: 2001, value: 2 }]);
  });
  it("never treats NASA fill values as data", () => {
    expect(seasonalSeries({ "200107": -999 }, [7], 2001, 2001)).toEqual([]);
  });
});
