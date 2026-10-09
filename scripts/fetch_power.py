#!/usr/bin/env python3
"""Fetch NASA POWER monthly point data for every Bangladesh district and cache
annual means locally. No API key required.

Dataset: NASA POWER (POWER_MONTHLY_AG) — https://power.larc.nasa.gov/
Parameters: T2M (air temp, C), ALLSKY_SFC_SW_DWN (solar, kWh/m2/day),
            PRECTOTCORR (precipitation, mm/day)
"""
import json
import os
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DISTRICTS = json.load(open(os.path.join(ROOT, "scripts", "districts.json")))
OUT = os.path.join(ROOT, "src", "data", "cache")
os.makedirs(OUT, exist_ok=True)

START, END = 2001, 2024
SOURCE_URL = "https://power.larc.nasa.gov/api/temporal/monthly/point"
PARAMS = "T2M,ALLSKY_SFC_SW_DWN,PRECTOTCORR"


def annual_means(series):
    """POWER monthly keys are YYYYMM, with MM=13 being the annual value."""
    out = {}
    for key, value in series.items():
        if value is None or value <= -900:
            continue
        year, month = int(key[:4]), int(key[4:])
        if month == 13:
            continue
        out.setdefault(year, []).append(value)
    return {
        year: round(sum(vals) / len(vals), 4)
        for year, vals in sorted(out.items())
        if len(vals) == 12
    }


def fetch(district):
    path = os.path.join(OUT, f"{district['id']}.json")
    existing = {}
    if os.path.exists(path):
        existing = json.load(open(path))
        if existing.get("variables", {}).get("temperature"):
            return district["id"], "skip"

    url = (
        f"{SOURCE_URL}?parameters={PARAMS}&community=AG"
        f"&latitude={district['lat']}&longitude={district['lon']}"
        f"&start={START}&end={END}&format=JSON"
    )
    for attempt in range(4):
        try:
            with urllib.request.urlopen(url, timeout=120) as resp:
                payload = json.loads(resp.read().decode())
            break
        except Exception as exc:  # noqa: BLE001
            if attempt == 3:
                return district["id"], f"fail {exc}"
            time.sleep(4 * (attempt + 1))

    p = payload["properties"]["parameter"]
    retrieved = datetime.now(timezone.utc).isoformat()
    provenance = {
        "dataset_id": "NASA_POWER_MONTHLY_AG_V9",
        "source_url": url,
        "retrieved": retrieved,
        "mode": "cache",
    }

    doc = existing or {"district": district["id"], "variables": {}}
    doc["district"] = district["id"]
    doc.setdefault("variables", {})
    doc["variables"]["temperature"] = {
        "unit": "°C",
        "label": "Air temperature (2 m)",
        "annual": annual_means(p["T2M"]),
        "provenance": provenance,
    }
    doc["variables"]["solar"] = {
        "unit": "kWh/m²/day",
        "label": "All-sky solar radiation",
        "annual": {year: value / (3.6 if payload["parameters"]["ALLSKY_SFC_SW_DWN"]["units"].startswith("MJ") else 1) for year, value in annual_means(p["ALLSKY_SFC_SW_DWN"]).items()},
        "provenance": provenance,
    }
    doc["variables"]["precipitation"] = {
        "unit": "mm/day",
        "label": "Precipitation",
        "annual": annual_means(p["PRECTOTCORR"]),
        "provenance": provenance,
    }
    with open(path, "w") as fh:
        json.dump(doc, fh, indent=1, sort_keys=True)
    return district["id"], "ok"


if __name__ == "__main__":
    with ThreadPoolExecutor(max_workers=6) as pool:
        for did, status in pool.map(fetch, DISTRICTS):
            print(f"{did}: {status}", flush=True)
            if status.startswith("fail"):
                sys.exit(1)
