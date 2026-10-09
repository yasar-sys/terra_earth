"""Reference Mann-Kendall + Theil-Sen implementation (numpy/scipy).
Mirrors src/lib/stats.ts. Cross-checked against pymannkendall.original_test / sens_slope.
"""
import numpy as np
from scipy import stats


def mann_kendall(values):
    x = np.asarray(values, dtype=float)
    n = len(x)
    s = sum(np.sign(x[j] - x[i]) for i in range(n - 1) for j in range(i + 1, n))
    _, counts = np.unique(x, return_counts=True)
    var_s = (n * (n - 1) * (2 * n + 5) - sum(c * (c - 1) * (2 * c + 5) for c in counts)) / 18
    z = 0.0 if s == 0 else (s - np.sign(s)) / np.sqrt(var_s)
    p = 2 * (1 - stats.norm.cdf(abs(z)))
    direction = "increasing" if z > 0 and p < 0.05 else "decreasing" if z < 0 and p < 0.05 else "no trend"
    return {"S": int(s), "var_s": float(var_s), "Z": float(z), "p_value": float(p),
            "tau": float(s / (0.5 * n * (n - 1))), "direction": direction,
            "significant_at_0.05": bool(p < 0.05)}


def theil_sen(years, values):
    slope, intercept, lo, hi = stats.theilslopes(values, years, alpha=0.95)
    return {"slope_per_year": float(slope), "intercept": float(intercept),
            "ci_low": float(lo), "ci_high": float(hi)}
