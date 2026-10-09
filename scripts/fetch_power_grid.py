"""Fetch NASA POWER regional (0.5 x 0.625 deg) monthly grids over Bangladesh and
store annual means per grid cell in src/data/grid/<variable>.json.
These real gridded values drive the /heatmap hex-bin layer.
"""
import json, os, sys, time, urllib.request
from datetime import datetime, timezone

PARAMS = {"temperature": ("T2M", "°C"), "precipitation": ("PRECTOTCORR", "mm/day"),
          "solar": ("ALLSKY_SFC_SW_DWN", "kWh/m²/day")}
BBOX = dict(lat_min=20.5, lat_max=26.7, lon_min=88.0, lon_max=92.7)
OUT = os.path.join(os.path.dirname(__file__), "..", "src", "data", "grid")
os.makedirs(OUT, exist_ok=True)

for key, (param, unit) in PARAMS.items():
    if len(sys.argv) > 1 and key not in sys.argv[1:]:
        continue
    url = ("https://power.larc.nasa.gov/api/temporal/monthly/regional?parameters=%s&community=AG"
           "&latitude-min=%s&latitude-max=%s&longitude-min=%s&longitude-max=%s&start=2001&end=2024&format=json"
           % (param, BBOX["lat_min"], BBOX["lat_max"], BBOX["lon_min"], BBOX["lon_max"]))
    doc = json.load(urllib.request.urlopen(url, timeout=120))
    cells = []
    for f in doc["features"]:
        lon, lat = f["geometry"]["coordinates"][:2]
        series = f["properties"]["parameter"][param]
        annual = {k[:4]: v for k, v in series.items() if k.endswith("13") and v is not None and v > -900}
        cells.append({"lat": lat, "lng": lon, "annual": annual})
    json.dump({"variable": key, "unit": unit, "cells": cells, "provenance": {
        "dataset_id": "NASA_POWER_MONTHLY_REGIONAL_%s" % param, "source_url": url,
        "retrieved": datetime.now(timezone.utc).isoformat(), "mode": "cache"}},
        open(os.path.join(OUT, key + ".json"), "w"))
    print(key, len(cells), "cells")
    time.sleep(1)
