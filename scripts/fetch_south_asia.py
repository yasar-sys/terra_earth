#!/usr/bin/env python3
"""Cache NASA observations for representative South Asian capital points.

Usage: python3 scripts/fetch_south_asia.py <location-id>
The points are representative samples, never national averages. MODIS years
use every available composite and require at least eight valid observations.
"""
import json
import math
import os
import sys
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOCATIONS = json.load(open(os.path.join(ROOT, "scripts", "south-asia-locations.json")))
OUT = os.path.join(ROOT, "src", "data", "south-asia")
POWER = "https://power.larc.nasa.gov/api/temporal/monthly/point"
MODIS = "https://modis.ornl.gov/rst/api/v1"
START, END = 2015, 2024
PRODUCTS = {
    "ndvi": {"product": "MOD13Q1", "band": "250m_16_days_NDVI", "scale": 0.0001, "offset": 0, "fill": -3000, "unit": "NDVI", "label": "Vegetation index (NDVI)", "dataset": "MOD13Q1.061"},
    "lst": {"product": "MOD11A2", "band": "LST_Day_1km", "scale": 0.02, "offset": -273.15, "fill": 0, "unit": "°C", "label": "Land surface temperature (day)", "dataset": "MOD11A2.061"},
}


def get(url, tries=4):
    for attempt in range(tries):
        try:
            request = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "TerraBangla/1.0"})
            with urllib.request.urlopen(request, timeout=90) as response:
                return json.loads(response.read().decode())
        except Exception:  # noqa: BLE001
            if attempt == tries - 1:
                return None
            time.sleep(2 * (attempt + 1))
    return None


def annual_monthly(series):
    grouped = {}
    for key, value in series.items():
        if value is None or value <= -900 or len(key) < 6:
            continue
        year, month = int(key[:4]), int(key[4:])
        if START <= year <= END and 1 <= month <= 12:
            grouped.setdefault(year, []).append(value)
    return {str(year): round(sum(values) / len(values), 4) for year, values in grouped.items() if len(values) == 12}


def fetch_power(location):
    query = urllib.parse.urlencode({"parameters": "T2M,ALLSKY_SFC_SW_DWN,PRECTOTCORR", "community": "AG", "latitude": location["lat"], "longitude": location["lon"], "start": START, "end": END, "format": "JSON"})
    url = f"{POWER}?{query}"
    payload = get(url)
    if not payload:
        return {}
    params = payload["properties"]["parameter"]
    provenance = {"dataset_id": "NASA_POWER_MONTHLY_AG_V9", "source_url": url, "retrieved": datetime.now(timezone.utc).isoformat(), "mode": "cache"}
    return {
        "temperature": {"unit": "°C", "label": "Air temperature (2 m)", "annual": annual_monthly(params["T2M"]), "provenance": provenance},
        "solar": {"unit": "kWh/m²/day", "label": "All-sky solar radiation", "annual": annual_monthly(params["ALLSKY_SFC_SW_DWN"]), "provenance": provenance},
        "precipitation": {"unit": "mm/day", "label": "Precipitation", "annual": annual_monthly(params["PRECTOTCORR"]), "provenance": provenance},
    }


def subset_job(location, key, config, year, dates):
    query = urllib.parse.urlencode({"latitude": location["lat"], "longitude": location["lon"], "band": config["band"], "startDate": dates[0], "endDate": dates[-1], "kmAboveBelow": 0, "kmLeftRight": 0})
    payload = get(f"{MODIS}/{config['product']}/subset?{query}") or {}
    values = []
    for entry in payload.get("subset", []):
        for raw in entry.get("data", []):
            if raw is not None and raw != config["fill"] and math.isfinite(raw):
                values.append(raw * config["scale"] + config["offset"])
    return key, year, values


def fetch_modis(location):
    jobs = []
    for key, config in PRODUCTS.items():
        date_payload = get(f"{MODIS}/{config['product']}/dates?latitude={location['lat']}&longitude={location['lon']}") or {}
        by_year = {year: [] for year in range(START, END + 1)}
        for item in date_payload.get("dates", []):
            date = item["modis_date"]
            year = int(date[1:5])
            if year in by_year:
                by_year[year].append(date)
        for year, dates in by_year.items():
            for index in range(0, len(dates), 10):
                jobs.append((location, key, config, year, dates[index:index + 10]))

    collected = {}
    with ThreadPoolExecutor(max_workers=14) as pool:
        futures = [pool.submit(subset_job, *job) for job in jobs]
        for future in as_completed(futures):
            key, year, values = future.result()
            collected.setdefault((key, year), []).extend(values)

    retrieved = datetime.now(timezone.utc).isoformat()
    result = {}
    for key, config in PRODUCTS.items():
        annual = {str(year): round(sum(values) / len(values), 4) for (variable, year), values in sorted(collected.items()) if variable == key and len(values) >= 8}
        result[key] = {
            "unit": config["unit"], "label": config["label"], "annual": annual,
            "provenance": {"dataset_id": config["dataset"], "source_url": f"{MODIS}/{config['product']}/subset (lat={location['lat']}, lon={location['lon']}, band={config['band']})", "retrieved": retrieved, "mode": "cache"},
        }
    return result


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Pass one location id")
    location = next((item for item in LOCATIONS if item["id"] == sys.argv[1]), None)
    if not location:
        raise SystemExit("Unknown location")
    record = {**location, "sample_type": "capital representative point", "variables": fetch_power(location)}
    record["variables"].update(fetch_modis(location))
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, f"{location['id']}.json"), "w") as file:
        json.dump(record, file, indent=1, ensure_ascii=False, sort_keys=True)
    print(location["id"], {key: len(value["annual"]) for key, value in record["variables"].items()})