"""Build the OSSL analysis table: one row per soil layer with
  - colour derived from its vis spectrum (CIE Lab / sRGB, D65, 2°)
  - a 10 nm-resolution vis-NIR spectrum (for the "full spectrum" upper bound)
  - harmonised lab values (OSSL L1) and site metadata

Input : data/raw/ossl_{visnir_L0,soillab_L1,soilsite_L0}_v1.2.csv.gz
Output: data/processed/ossl_layers.parquet

Source: Open Soil Spectral Library v1.2 (soilspectroscopy.org), CC-BY 4.0.
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from sawa_ml.colour_spectra import spectra_to_colour  # noqa: E402

RAW = ROOT / "data" / "raw"
OUT = ROOT / "data" / "processed"
OUT.mkdir(parents=True, exist_ok=True)

WL_ALL = np.arange(350, 2501, 2)
VIS = WL_ALL[(WL_ALL >= 400) & (WL_ALL <= 780)]  # LUCAS starts at 400 nm; 380–400 nm carries <0.1% of Y
COARSE = np.arange(400, 2500, 10)  # 210 bands for the spectrum model

LAB_COLS = {
    "oc_usda.c729_w.pct": "oc_pct",
    "c.tot_usda.a622_w.pct": "ctot_pct",
    "n.tot_usda.a623_w.pct": "ntot_pct",
    "ph.h2o_usda.a268_index": "ph_h2o",
    "ph.cacl2_usda.a481_index": "ph_cacl2",
    "p.ext_usda.a274_mg.kg": "p_olsen_mgkg",
    "p.ext_usda.a270_mg.kg": "p_bray_mgkg",
    "p.ext_usda.a1070_mg.kg": "p_m3_mgkg",
    "k.ext_usda.a725_cmolc.kg": "k_nh4oac_cmolkg",
    "k.ext_usda.a1065_mg.kg": "k_m3_mgkg",
    "clay.tot_usda.a334_w.pct": "clay_pct",
    "sand.tot_usda.c60_w.pct": "sand_pct",
    "silt.tot_usda.c62_w.pct": "silt_pct",
    "caco3_usda.a54_w.pct": "caco3_pct",
    "cec_usda.a723_cmolc.kg": "cec_cmolkg",
    "ec_usda.a364_ds.m": "ec_dsm",
}
SITE_COLS = {
    "longitude.point_wgs84_dd": "lon",
    "latitude.point_wgs84_dd": "lat",
    "layer.upper.depth_usda_cm": "depth_top",
    "layer.lower.depth_usda_cm": "depth_bottom",
    "location.country_iso.3166_txt": "country",
    "id.location_olc_txt": "olc",
    "id.project_ascii_txt": "project",
}


def main() -> None:
    vis_cols = [f"scan_visnir.{w}_ref" for w in VIS]
    coarse_cols = [f"scan_visnir.{w}_ref" for w in COARSE]
    meta = ["dataset.code_ascii_txt", "id.layer_uuid_txt", "scan.visnir.model.name_utf8_txt"]
    usecols = list(dict.fromkeys(meta + vis_cols + coarse_cols))

    parts = []
    reader = pd.read_csv(RAW / "ossl_visnir_L0_v1.2.csv.gz", usecols=usecols, chunksize=5000, low_memory=False)
    for i, ch in enumerate(reader):
        vis = ch[vis_cols].to_numpy(dtype=np.float32)
        ok = np.isfinite(vis).all(axis=1)
        ch, vis = ch.loc[ok], vis[ok]
        if not len(ch):
            continue
        # OSSL L0 reflectance is a 0–1 fraction; some sources store percent.
        scale = np.where(np.nanmax(vis, axis=1) > 1.5, 0.01, 1.0).astype(np.float32)
        vis = vis * scale[:, None]
        col = spectra_to_colour(vis.astype(np.float64), VIS.astype(float))
        spec = ch[coarse_cols].to_numpy(dtype=np.float32) * scale[:, None]
        df = pd.DataFrame({
            "dataset": ch["dataset.code_ascii_txt"].values,
            "layer_id": ch["id.layer_uuid_txt"].values,
            "instrument": ch["scan.visnir.model.name_utf8_txt"].values,
            **{k: v.astype(np.float32) for k, v in col.items()},
        })
        sdf = pd.DataFrame(spec, columns=[f"s{w}" for w in COARSE])
        parts.append(pd.concat([df.reset_index(drop=True), sdf], axis=1))
        print(f"chunk {i}: kept {ok.sum()}/{len(ok)}", flush=True)

    scans = pd.concat(parts, ignore_index=True)
    num = scans.columns.difference(["dataset", "layer_id", "instrument"])
    # Several scans per layer -> average them.
    scans = scans.copy()
    layers = scans.groupby("layer_id", sort=False).agg(
        {**{c: "mean" for c in num}, "dataset": "first", "instrument": "first"}).reset_index()
    layers["n_scans"] = scans.groupby("layer_id", sort=False).size().values

    lab = pd.read_csv(RAW / "ossl_soillab_L1_v1.2.csv.gz", usecols=["id.layer_uuid_txt", *LAB_COLS],
                      low_memory=False).rename(columns={"id.layer_uuid_txt": "layer_id", **LAB_COLS})
    site = pd.read_csv(RAW / "ossl_soilsite_L0_v1.2.csv.gz", usecols=["id.layer_uuid_txt", *SITE_COLS],
                       low_memory=False).rename(columns={"id.layer_uuid_txt": "layer_id", **SITE_COLS})
    out = layers.merge(lab, on="layer_id", how="left").merge(site, on="layer_id", how="left")
    for c in ["lon", "lat", "depth_top", "depth_bottom"]:
        out[c] = pd.to_numeric(out[c], errors="coerce")
    out.to_parquet(OUT / "ossl_layers.parquet", index=False)
    print(out.shape)
    print(out[list(LAB_COLS.values())].notna().sum().to_string())


if __name__ == "__main__":
    main()
