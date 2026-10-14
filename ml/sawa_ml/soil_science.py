"""Soil-science lookups used to turn lab numbers into the classes a farmer sees."""
from __future__ import annotations

import numpy as np

# mg/kg -> kg/ha for a 15 cm furrow slice at ~1.5 g/cm3 (2.24 million kg soil/ha),
# the conversion Indian soil labs conventionally use. An assumption, stated in reports.
MGKG_TO_KGHA = 2.24
K_CMOL_TO_MGKG = 391.0  # 1 cmol(+)/kg of K = 391 mg/kg

# Soil Health Card style rating bands (kg/ha), commonly used in India.
SHC_P_KGHA = (10.0, 25.0)   # available P (Olsen): Low <10, Medium 10–25, High >25
SHC_K_KGHA = (110.0, 280.0)  # available K (NH4OAc): Low <110, Medium 110–280, High >280
SHC_OC_PCT = (0.5, 0.75)    # organic carbon %: Low <0.5, Medium 0.5–0.75, High >0.75
SAWA_PH = (6.0, 7.5)        # the app's own pH bands (soil-engine.ts levelOf)


def band3(v, low, high):
    v = np.asarray(v, dtype=float)
    return np.where(v < low, 0, np.where(v > high, 2, 1))


def usda_texture(clay, sand, silt) -> np.ndarray:
    """USDA texture class from particle-size fractions (%)."""
    clay, sand, silt = (np.asarray(x, dtype=float) for x in (clay, sand, silt))
    out = np.full(clay.shape, "", dtype=object)
    rules = [
        ("sand", silt + 1.5 * clay < 15),
        ("loamy sand", (silt + 1.5 * clay >= 15) & (silt + 2 * clay < 30)),
        ("sandy loam", ((clay >= 7) & (clay < 20) & (sand > 52) & (silt + 2 * clay >= 30))
         | ((clay < 7) & (silt < 50) & (silt + 2 * clay >= 30))),
        ("loam", (clay >= 7) & (clay < 27) & (silt >= 28) & (silt < 50) & (sand <= 52)),
        ("silt loam", ((silt >= 50) & (clay >= 12) & (clay < 27)) | ((silt >= 50) & (silt < 80) & (clay < 12))),
        ("silt", (silt >= 80) & (clay < 12)),
        ("sandy clay loam", (clay >= 20) & (clay < 35) & (silt < 28) & (sand > 45)),
        ("clay loam", (clay >= 27) & (clay < 40) & (sand > 20) & (sand <= 45)),
        ("silty clay loam", (clay >= 27) & (clay < 40) & (sand <= 20)),
        ("sandy clay", (clay >= 35) & (sand > 45)),
        ("silty clay", (clay >= 40) & (silt >= 40)),
        ("clay", (clay >= 40) & (sand <= 45) & (silt < 40)),
    ]
    for name, m in rules:
        out[(out == "") & m] = name
    out[np.isnan(clay) | np.isnan(sand) | np.isnan(silt)] = ""
    return out


# USDA classes -> the four names SAWA shows.
TEXTURE_TO_SAWA = {
    "sand": "Sandy", "loamy sand": "Sandy",
    "sandy loam": "Loamy", "loam": "Loamy", "sandy clay loam": "Loamy",
    "silt loam": "Silty", "silt": "Silty",
    "clay loam": "Clay", "silty clay loam": "Clay", "sandy clay": "Clay", "silty clay": "Clay", "clay": "Clay",
}
