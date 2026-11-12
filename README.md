# 🌍 Terra Earth — Planetary Science for Every Citizen

[![NASA Space Apps Challenge 2026](https://img.shields.io/badge/NASA%20Space%20Apps-2026-blue.svg)](https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/)
[![Challenge](https://img.shields.io/badge/Challenge-Earth%20System%20Trend%20Detective-orange.svg)](https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/)
[![Live App](https://img.shields.io/badge/Live%20Platform-terraearth.aizanbd.com-success.svg)](https://terraearth.aizanbd.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Team:** MEC Terra_Detectors  
> **Global Hackathon:** 2026 NASA Space Apps Challenge  
> **Live Interactive Web Platform:** [https://terraearth.aizanbd.com](https://terraearth.aizanbd.com)

---

## 📖 Overview

**Terra Earth** is an open-source, bilingual (English & বাংলা) planetary intelligence platform designed for the **2026 NASA Space Apps Challenge: Earth System Trend Detective**.

Instead of flattening massive geographic diversity into misleading country-wide averages, Terra Earth anchors all environmental evidence to precise, verifiable geographic coordinates. Powered by **44 years (1981–2024)** of raw NASA satellite telemetry and reanalysis models, Terra Earth computes seasonal shifts using non-parametric **Theil-Sen regression** and **Mann-Kendall significance tests** ($p$-values and 95% confidence intervals)—never fabricating missing telemetry or smoothing away uncertainty.

---

## ✨ Key Features

- **Interactive 3D Earth Explorer:** Photorealistic day/night textures, city lights, topology bump maps, and real-time lighting without misleading raster approximations.
- **Trend Detective Engine:** Guided curiosity inquiries across 6 biomes and custom seasons with OLS, Theil-Sen slopes, Mann-Kendall $p$-values, and sampled regional averages.
- **Grounded Terra Earth AI:** LLM climate explanations strictly constrained to server-recomputed NASA statistics with live provenance citations.
- **Global Climate Heatmap & Multi-City Compare:** Cross-continental environmental shifts with per-sample provenance tracking.
- **Bilingual Children's Detective Comic:** A 14-scene evidence-based interactive story in English and Bengali.
- **In-App Academic Research Paper & Exports:** Full methodology documentation with one-click citation-ready PDF and CSV data downloads.

---

## 🛰️ NASA Telemetry & Datasets Used

| Dataset / Mission | Source | Parameters | Coverage |
| :--- | :--- | :--- | :--- |
| **NASA POWER API** | Langley Research Center (LaRC) | $T_{2M}$, $T_{max}$, Solar Radiation, RH, Soil Wetness | 1981–2024 (Monthly) |
| **NASA MODIS** | Terra & Aqua Satellites | MOD13Q1 Vegetation (NDVI), MOD11A2 Land Surface Temp | 2015–2024 (Composites) |
| **NASA GPM** | Global Precipitation Measurement | IMERG Satellite-Gauge Corrected Precipitation | 1981–2024 |
| **NASA MERRA-2** | Goddard Space Flight Center (GSFC) | Wind Velocity ($WS_{2M}$), Aerosol Optical Depth ($AOD_{55}$) | 1981–2024 |
| **NASA CERES** | SYN1deg | Total Column Ozone ($TO_3$) | 1981–2024 |

---

## 👥 Team MEC Terra_Detectors

- **SAMIN YASAR** — Team Lead & Full-Stack Developer
- **MD MAHMUDUZZAMAN** — DATA SCIENTIST
- **RAHIATUL JANNAT** — DATA SCIENTIST
- **SAYEEM SHAHRIAR SAMI** — DESIGNER
- **MOHSINA MOHONA** — RESEARCHER
- **NUSRAT JAHAN** — PRESENTER AND STORYTELLER


---

⭐ *Built with passion for open science and global climate resilience.*

