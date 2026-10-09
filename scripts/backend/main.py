"""FastAPI reference backend — MEC TERRA_DETECTORS.

Run:  OFFLINE=1 uvicorn scripts.backend.main:app --reload
GET /trend?district=dhaka&variable=temperature&start=2001&end=2024

Reads ONLY the pre-cached files in src/data/cache/<district>.json (the same
files the web app uses). With OFFLINE=1 any attempt at a live fetch is refused.
"""
import json, os
from pathlib import Path
from fastapi import FastAPI, HTTPException, Query
from .stats import mann_kendall, theil_sen

CACHE = Path(__file__).resolve().parents[2] / "src" / "data" / "cache"
OFFLINE = os.environ.get("OFFLINE", "1") == "1"
app = FastAPI(title="Bangladesh Trend Detective", version="1.0")


@app.get("/trend")
def trend(district: str, variable: str, start: int = Query(2001), end: int = Query(2024)):
    path = CACHE / f"{district}.json"
    if not path.exists():
        if OFFLINE:
            raise HTTPException(404, "Data not yet available for this district (OFFLINE=1, no cache).")
        raise HTTPException(501, "Live fetch not implemented in demo build.")
    doc = json.loads(path.read_text())
    var = doc["variables"].get(variable)
    if not var:
        raise HTTPException(404, f"No cached {variable} for {district}.")
    pts = sorted((int(y), v) for y, v in var["annual"].items() if start <= int(y) <= end)
    if len(pts) < 5:
        raise HTTPException(422, "Fewer than 5 observations in window.")
    years, vals = zip(*pts)
    sl = theil_sen(years, vals)
    return {"district": district, "variable": variable, "period": {"start": years[0], "end": years[-1]},
            "n_observations": len(pts), "trend": mann_kendall(vals),
            "slope": {**sl, "units": f"{var['unit']}/year"},
            "provenance": {**var["provenance"], "mode": "cache" if OFFLINE else var["provenance"]["mode"]}}
