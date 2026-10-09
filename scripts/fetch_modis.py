#!/usr/bin/env python3
"""Fetch MODIS NDVI (MOD13Q1) and land surface temperature (MOD11A2) for every
Bangladesh district centroid from the ORNL DAAC MODIS/VIIRS Subsets REST API
and merge annual means into the local cache. No API key required.

Docs: https://modis.ornl.gov/data/modis_webservice.html
"""
import fcntl
import json
import sys
import os
import threading
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DISTRICTS = json.load(open(os.path.join(ROOT, "scripts", "districts.json")))
OUT = os.path.join(ROOT, "src", "data", "cache")
API = "https://modis.ornl.gov/rst/api/v1"
LOCK = threading.Lock()
START_YEAR, END_YEAR = 2001, 2024

PRODUCTS = {
    "ndvi": {
        "product": "MOD13Q1",
        "band": "250m_16_days_NDVI",
        "scale": 0.0001,
        "fill": -3000,
        "unit": "NDVI",
        "label": "Vegetation index (NDVI)",
        "offset": 0.0,
        "dataset_id": "MOD13Q1.061",
    },
    "lst": {
        "product": "MOD11A2",
        "band": "LST_Day_1km",
        "scale": 0.02,
        "fill": 0,
        "unit": "°C",
        "label": "Land surface temperature (day)",
        "offset": -273.15,
        "dataset_id": "MOD11A2.061",
    },
}


def get(url, tries=4):
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers={"Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=180) as resp:
                return json.loads(resp.read().decode())
        except Exception:  # noqa: BLE001
            if attempt == tries - 1:
                return None
            time.sleep(3 * (attempt + 1))
    return None


def dates_for(product, d):
    data = get(f"{API}/{product}/dates?latitude={d['lat']}&longitude={d['lon']}")
    if not isinstance(data, dict):
        return []
    return [x["modis_date"] for x in data["dates"]]


def chunks(seq, size=10):
    for i in range(0, len(seq), size):
        yield seq[i : i + size]


def fetch_variable(d, key):
    cfg = PRODUCTS[key]
    path = os.path.join(OUT, f"{d['id']}.json")
    doc = json.load(open(path)) if os.path.exists(path) else {"district": d["id"], "variables": {}}
    if doc.get("variables", {}).get(key, {}).get("annual"):
        return "skip"

    all_dates = [x for x in dates_for(cfg["product"], d) if START_YEAR <= int(x[1:5]) <= END_YEAR]
    if not all_dates:
        return "no-dates"

    per_year = {}
    for year in range(START_YEAR, END_YEAR + 1):
        yd = [x for x in all_dates if int(x[1:5]) == year]
        per_year[year] = list(chunks(yd, 10))

    values = {}
    for year, groups in per_year.items():
        samples = []
        for group in groups:
            url = (
                f"{API}/{cfg['product']}/subset?latitude={d['lat']}&longitude={d['lon']}"
                f"&band={cfg['band']}&startDate={group[0]}&endDate={group[-1]}"
                f"&kmAboveBelow=0&kmLeftRight=0"
            )
            payload = get(url)
            if not isinstance(payload, dict):
                continue
            for entry in payload.get("subset", []):
                for raw in entry.get("data", []):
                    if raw is None or raw == cfg["fill"]:
                        continue
                    samples.append(raw * cfg["scale"] + cfg["offset"])
        if len(samples) >= 8:
            values[year] = round(sum(samples) / len(samples), 4)

    if len(values) < 10:
        return f"sparse({len(values)})"

    provenance = {
        "dataset_id": cfg["dataset_id"],
        "source_url": f"{API}/{cfg['product']}/subset (lat={d['lat']}, lon={d['lon']}, band={cfg['band']})",
        "retrieved": datetime.now(timezone.utc).isoformat(),
        "mode": "cache",
    }
    with LOCK, open(path + ".lock", "w") as lk:
        fcntl.flock(lk, fcntl.LOCK_EX)
        doc = json.load(open(path)) if os.path.exists(path) else doc
        doc.setdefault("variables", {})
        doc["variables"][key] = {
            "unit": cfg["unit"],
            "label": cfg["label"],
            "annual": {str(y): v for y, v in sorted(values.items())},
            "provenance": provenance,
        }
        with open(path, "w") as fh:
            json.dump(doc, fh, indent=1, sort_keys=True)
    return f"ok({len(values)})"


def work(job):
    d, key = job
    try:
        return f"{d['id']}/{key}: {fetch_variable(d, key)}"
    except Exception as exc:  # noqa: BLE001
        return f"{d['id']}/{key}: error {exc}"


if __name__ == "__main__":
    jobs = [(d, k) for d in DISTRICTS for k in ("ndvi", "lst")]
    if "--reverse" in sys.argv:
        jobs.reverse()
    with ThreadPoolExecutor(max_workers=12) as pool:
        for line in pool.map(work, jobs):
            print(line, flush=True)
