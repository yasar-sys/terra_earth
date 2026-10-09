#!/usr/bin/env python3
"""Build heatmap point sets for NDVI and LST from the cached MODIS samples
(one real satellite sample site per district centroid). No interpolation."""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = json.load(open(os.path.join(ROOT, "scripts", "districts.json")))
for var in ("ndvi", "lst"):
    cells, prov, unit = [], None, None
    for d in D:
        v = json.load(open(os.path.join(ROOT, "src/data/cache", d["id"] + ".json")))["variables"].get(var)
        if not v or len(v["annual"]) < 5: continue
        cells.append({"lat": d["lat"], "lng": d["lon"], "annual": v["annual"]})
        prov = prov or v["provenance"]; unit = v["unit"]
    prov = dict(prov, dataset_id=prov["dataset_id"] + " (64 district sample sites)")
    json.dump({"variable": var, "unit": unit, "cells": cells, "provenance": prov},
              open(os.path.join(ROOT, "src/data/grid", var + ".json"), "w"))
    print(var, len(cells))
