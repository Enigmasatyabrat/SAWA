"""Soil colour from reflectance spectra (CIE 1931 2°, illuminant D65).

Gives the colour a perfectly calibrated camera would see for a dried, sieved
lab sample. Vectorised: one matrix product for all spectra.
"""
from __future__ import annotations

import colour
import numpy as np


def _weights(wavelengths: np.ndarray) -> tuple[np.ndarray, float]:
    cmfs = colour.MSDS_CMFS["CIE 1931 2 Degree Standard Observer"]
    ill = colour.SDS_ILLUMINANTS["D65"]
    xbar = np.stack([np.interp(wavelengths, cmfs.wavelengths, cmfs.values[:, i]) for i in range(3)], axis=1)
    s = np.interp(wavelengths, ill.wavelengths, ill.values)
    w = xbar * s[:, None]  # (n_wl, 3)
    k = 1.0 / w[:, 1].sum()  # Y of a perfect white = 1
    return w * k, k


def spectra_to_colour(refl: np.ndarray, wavelengths: np.ndarray) -> dict[str, np.ndarray]:
    """refl: (n, n_wl) reflectance as a 0–1 fraction over 380–780 nm."""
    w, _ = _weights(wavelengths)
    xyz = refl @ w  # (n, 3), Y in 0–1
    lab = colour.XYZ_to_Lab(xyz, colour.CCS_ILLUMINANTS["CIE 1931 2 Degree Standard Observer"]["D65"])
    rgb_lin = colour.XYZ_to_sRGB(xyz, apply_cctf_encoding=True)
    rgb = np.clip(rgb_lin, 0, 1) * 255
    lch = colour.Lab_to_LCHab(lab)
    return {
        "X": xyz[:, 0], "Y": xyz[:, 1], "Z": xyz[:, 2],
        "L": lab[:, 0], "a": lab[:, 1], "b": lab[:, 2],
        "C": lch[:, 1], "h": lch[:, 2],
        "R": rgb[:, 0], "G": rgb[:, 1], "B": rgb[:, 2],
    }
