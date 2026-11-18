"""Python port of SAWA's current colour heuristics (src/lib/soil-engine.ts).

Used only to *evaluate* the shipped formulas against lab data. The random
noise terms in the TypeScript (gaussianNoise) are omitted, so these are the
expected values of what the app shows.
"""
from __future__ import annotations

import numpy as np

SOIL_TYPES = ("Sandy", "Loamy", "Clay", "Silty", "Mixed")


def soil_type(r: np.ndarray, g: np.ndarray, b: np.ndarray) -> np.ndarray:
    """First-match RGB rules, same order as classifySoil() in soil-engine.ts."""
    out = np.full(r.shape, "Mixed", dtype=object)
    undecided = np.ones(r.shape, dtype=bool)
    rules = [
        ("Sandy", (r > 180) & (g > 140) & (b > 100)),
        ("Loamy", (r > 100) & (g > 80) & (b > 60) & (r < 150)),
        ("Clay", (r < 100) & (g < 80) & (b < 60)),
        ("Silty", (r > 120) & (g > 100) & (b < 80)),
    ]
    for name, hit in rules:
        m = undecided & hit
        out[m] = name
        undecided &= ~m
    return out


def nutrients(r: np.ndarray, g: np.ndarray, b: np.ndarray, stype: np.ndarray) -> dict[str, np.ndarray]:
    """predictNutrients() without noise. Returns pH and unitless N/P/K scores."""
    d = 1 - (r + g + b) / (3 * 255)
    ph = np.clip(7.5 - d * 2, 5.0, 8.0)
    n = np.clip(d * 100, 10, 150)
    p = np.clip((d * 0.7 + 0.3) * 80, 5, 100)
    k = np.where(stype == "Clay", 80.0, np.where(stype == "Sandy", 40.0, 60.0))
    return {"darkness": d, "ph": ph, "n": n, "p": p, "k": k}


def band3(v: np.ndarray, low: float, high: float) -> np.ndarray:
    """levelOf(): <low -> 0, >high -> 2, else 1."""
    return np.where(v < low, 0, np.where(v > high, 2, 1))


# levelOf thresholds in soil-engine.ts
SAWA_BANDS = {"ph": (6.0, 7.5), "n": (40, 80), "p": (30, 60), "k": (40, 70)}
