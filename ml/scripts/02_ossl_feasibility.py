"""Study A — can soil colour predict what SAWA claims, using lab ground truth?

Three questions, all on the OSSL layer table from 01_prepare_ossl.py:

  A1. How do SAWA's *shipped* heuristics (soil-engine.ts) compare with lab values?
  A2. What can a model learn from colour alone (the best a calibrated phone
      could do), versus a darkness-only model and a full vis-NIR spectrum?
  A3. Does a colour model trained in one region transfer to another?

Evaluation: 5-fold GroupKFold on spatial groups (0.5° cells / projects), so the
same location never sits in both train and test. CIs: cluster bootstrap.

Output: reports/study_a_ossl.json, reports/figures/study_a_*.png
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import lightgbm as lgb
import matplotlib
import numpy as np
import pandas as pd
from sklearn.model_selection import GroupKFold

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from sawa_ml import heuristic as H  # noqa: E402
from sawa_ml.evaluation import cls_metrics, cluster_bootstrap, reg_metrics, spatial_groups  # noqa: E402
from sawa_ml.soil_science import (K_CMOL_TO_MGKG, MGKG_TO_KGHA, SAWA_PH, SHC_K_KGHA, SHC_OC_PCT,  # noqa: E402
                                  SHC_P_KGHA, TEXTURE_TO_SAWA, band3, usda_texture)

REPORTS = ROOT / "reports"
FIG = REPORTS / "figures"
FIG.mkdir(parents=True, exist_ok=True)
SEED = 42

COLOUR = ["L", "a", "b", "C", "h"]
DARK = ["darkness"]
LGB_REG = dict(n_estimators=500, learning_rate=0.05, num_leaves=63, min_child_samples=40,
               subsample=0.8, subsample_freq=1, colsample_bytree=0.8, random_state=SEED, n_jobs=6, verbose=-1)


def load() -> pd.DataFrame:
    d = pd.read_parquet(ROOT / "data" / "processed" / "ossl_layers.parquet")
    d["darkness"] = 1 - (d["R"] + d["G"] + d["B"]) / 765
    d["group"] = spatial_groups(d)
    d["p_kgha"] = d["p_olsen_mgkg"] * MGKG_TO_KGHA
    d["k_kgha"] = d["k_nh4oac_cmolkg"] * K_CMOL_TO_MGKG * MGKG_TO_KGHA
    tex = usda_texture(d["clay_pct"], d["sand_pct"], d["silt_pct"])
    d["texture_usda"] = tex
    d["texture_sawa"] = pd.Series(tex).map(TEXTURE_TO_SAWA).fillna("").values
    # Main population: topsoil (what a farmer photographs), mineral soils.
    # Organic soils (OC >= 12 %, i.e. peats) are excluded and reported separately.
    d["topsoil"] = d["depth_top"].fillna(0) <= 30
    d["mineral"] = d["oc_pct"].fillna(0) < 12
    return d


def spectrum_cols(d):
    return [c for c in d.columns if c.startswith("s") and c[1:].isdigit()]


def cv_predict(X: np.ndarray, y: np.ndarray, groups: np.ndarray, kind: str) -> np.ndarray:
    pred = np.empty(len(y), dtype=object if kind == "cls" else float)
    for tr, te in GroupKFold(n_splits=5).split(X, y, groups):
        if kind == "reg":
            m = lgb.LGBMRegressor(**LGB_REG).fit(X[tr], y[tr])
        else:
            m = lgb.LGBMClassifier(**LGB_REG, class_weight="balanced").fit(X[tr], y[tr])
        pred[te] = m.predict(X[te])
    return pred


def with_ci(metric_fn, y, p, groups):
    m = metric_fn(y, p)
    key = "r2" if "r2" in m else "macro_f1"
    lo, hi = cluster_bootstrap(groups, lambda i: metric_fn(y[i], p[i])[key], n_boot=200)
    m[f"{key}_ci95"] = [round(lo, 3), round(hi, 3)]
    return {k: (round(v, 4) if isinstance(v, float) else v) for k, v in m.items()}


# ---------------------------------------------------------------------------
# A1. The shipped heuristics against the lab
# ---------------------------------------------------------------------------
def study_a1(d: pd.DataFrame) -> dict:
    s = d[d.topsoil & d.mineral].copy()
    stype = H.soil_type(s.R.values, s.G.values, s.B.values)
    nut = H.nutrients(s.R.values, s.G.values, s.B.values, stype)
    out = {"population": "topsoil (top <= 30 cm), mineral (OC < 12 %)", "n": int(len(s))}

    def rank_corr(lab_col, pred):
        m = s[lab_col].notna().values
        from scipy.stats import spearmanr
        return {"n": int(m.sum()), "spearman": round(float(spearmanr(s[lab_col].values[m], pred[m]).statistic), 3)}

    out["ph_formula_vs_lab_ph"] = rank_corr("ph_h2o", nut["ph"])
    m = s.ph_h2o.notna().values
    lab_ph = s.ph_h2o.values[m]
    out["ph_formula_vs_lab_ph"].update({
        "mae_ph_units": round(float(np.abs(nut["ph"][m] - lab_ph).mean()), 2),
        "band_agreement": round(float((band3(nut["ph"][m], *SAWA_PH) == band3(lab_ph, *SAWA_PH)).mean()), 3),
        "lab_band_share": np.bincount(band3(lab_ph, *SAWA_PH), minlength=3).tolist(),
        "sawa_band_share": np.bincount(band3(nut["ph"][m], *SAWA_PH), minlength=3).tolist(),
    })
    out["n_score_vs_lab_total_n"] = rank_corr("ntot_pct", nut["n"])
    out["n_score_vs_lab_oc"] = rank_corr("oc_pct", nut["n"])
    for key, lab_col, (lo, hi), bands in [("p", "p_kgha", SHC_P_KGHA, H.SAWA_BANDS["p"]),
                                          ("k", "k_kgha", SHC_K_KGHA, H.SAWA_BANDS["k"])]:
        m = s[lab_col].notna().values
        lab_band = band3(s[lab_col].values[m], lo, hi)
        app_band = band3(nut[key][m], *bands)
        out[f"{key}_score_vs_lab"] = {**rank_corr(lab_col, nut[key]),
                                      "band_agreement_vs_shc": round(float((lab_band == app_band).mean()), 3),
                                      "majority_baseline": round(float(np.bincount(lab_band).max() / len(lab_band)), 3),
                                      "lab_band_share": np.bincount(lab_band, minlength=3).tolist(),
                                      "sawa_band_share": np.bincount(app_band, minlength=3).tolist()}
    m = s.texture_sawa.values != ""
    truth, app = s.texture_sawa.values[m], stype[m]
    labels = ["Sandy", "Loamy", "Silty", "Clay"]
    cm = pd.crosstab(pd.Series(truth, name="lab_texture"), pd.Series(app, name="sawa_rgb_rule"))
    out["soil_type_rule_vs_lab_texture"] = {
        "n": int(m.sum()),
        "accuracy": round(float((truth == app).mean()), 3),
        "majority_baseline": round(float(pd.Series(truth).value_counts(normalize=True).iloc[0]), 3),
        "share_labelled_mixed": round(float((app == "Mixed").mean()), 3),
        "confusion": cm.reindex(index=labels, columns=labels + ["Mixed"], fill_value=0).astype(int).to_dict(),
    }

    fig, ax = plt.subplots(1, 3, figsize=(15, 4.5))
    mm = s.ph_h2o.notna().values
    ax[0].hexbin(nut["ph"][mm], s.ph_h2o.values[mm], gridsize=40, bins="log", cmap="YlOrBr")
    ax[0].plot([5, 8], [5, 8], "k--", lw=1)
    ax[0].set(xlabel="SAWA pH formula (7.5 − 2·darkness)", ylabel="Lab pH (H2O)", title="pH: app formula vs lab")
    mm = (s.ntot_pct > 0).values
    ax[1].hexbin(nut["n"][mm], s.ntot_pct.values[mm], gridsize=40, bins="log", cmap="YlOrBr", yscale="log")
    ax[1].set(xlabel="SAWA N score (100·darkness)", ylabel="Lab total N (%)", title="N: app score vs lab")
    mm = s.k_kgha.notna().values
    ax[2].boxplot([s.k_kgha.values[mm][stype[mm] == t] for t in ["Sandy", "Loamy", "Silty", "Clay", "Mixed"]],
                  tick_labels=["Sandy\n(K=40)", "Loamy\n(60)", "Silty\n(60)", "Clay\n(80)", "Mixed\n(60)"], showfliers=False)
    ax[2].set(ylabel="Lab available K (kg/ha)", title="K: app value by RGB soil type vs lab")
    fig.tight_layout()
    fig.savefig(FIG / "study_a1_heuristics_vs_lab.png", dpi=130)
    plt.close(fig)
    return out


# ---------------------------------------------------------------------------
# A2. What colour can and cannot predict (grouped CV)
# ---------------------------------------------------------------------------
TARGETS = [
    # name, column, kind, transform, class bands (for derived classes)
    ("organic_carbon_pct", "oc_pct", "reg", "log1p", SHC_OC_PCT),
    ("total_n_pct", "ntot_pct", "reg", "log1p", None),
    ("ph_h2o", "ph_h2o", "reg", None, SAWA_PH),
    ("available_p_kgha", "p_kgha", "reg", "log1p", SHC_P_KGHA),
    ("available_k_kgha", "k_kgha", "reg", "log1p", SHC_K_KGHA),
    ("clay_pct", "clay_pct", "reg", None, None),
    ("sand_pct", "sand_pct", "reg", None, None),
    ("caco3_pct", "caco3_pct", "reg", "log1p", None),
    ("texture_class_sawa", "texture_sawa", "cls", None, None),
]


def study_a2(d: pd.DataFrame) -> dict:
    s = d[d.topsoil & d.mineral].reset_index(drop=True)
    spec = spectrum_cols(s)
    feats = {"darkness_only": DARK, "colour_Lab": COLOUR, "full_visnir_spectrum": spec}
    res = {}
    preds_for_plot = {}
    for name, col, kind, tf, bands in TARGETS:
        m = (s[col].notna() & (s[col] != "")).values if kind == "cls" else s[col].notna().values
        sub = s[m].reset_index(drop=True)
        g = sub["group"].values
        y_raw = sub[col].values
        r = {"n": int(len(sub)), "n_groups": int(len(np.unique(g)))}
        if kind == "reg":
            y = np.log1p(y_raw) if tf == "log1p" else y_raw.astype(float)
            inv = np.expm1 if tf == "log1p" else (lambda v: v)
            # baseline: predict the training-fold mean (log space)
            base = np.empty(len(y))
            for tr, te in GroupKFold(5).split(y, y, g):
                base[te] = y[tr].mean()
            r["baseline_mean"] = with_ci(reg_metrics, y, base, g)
            for fname, cols in feats.items():
                p = cv_predict(sub[cols].to_numpy(np.float32), y, g, "reg")
                r[fname] = with_ci(reg_metrics, y, p, g)
                if bands is not None:
                    yb, pb = band3(inv(y), *bands), band3(inv(p), *bands)
                    r[fname]["band_from_regression"] = with_ci(cls_metrics, yb, pb, g)
                    if fname == "darkness_only":
                        r["band_majority_baseline"] = round(float(np.bincount(yb).max() / len(yb)), 4)
                        r["band_share"] = np.bincount(yb, minlength=3).tolist()
                if fname == "colour_Lab":
                    preds_for_plot[name] = (inv(y), inv(p))
        else:
            y = y_raw.astype(str)
            maj = pd.Series(y).value_counts().index[0]
            r["baseline_majority"] = with_ci(cls_metrics, y, np.full(len(y), maj), g)
            for fname, cols in feats.items():
                p = cv_predict(sub[cols].to_numpy(np.float32), y, g, "cls").astype(str)
                r[fname] = with_ci(cls_metrics, y, p, g)
        res[name] = r
        print(name, {k: v.get("r2", v.get("macro_f1")) for k, v in r.items() if isinstance(v, dict)}, flush=True)

    fig, axes = plt.subplots(2, 4, figsize=(18, 8.5))
    for ax, (name, (yt, yp)) in zip(axes.ravel(), preds_for_plot.items()):
        lo, hi = np.percentile(np.r_[yt, yp], [1, 99])
        ax.hexbin(yp, yt, gridsize=40, bins="log", cmap="YlOrBr", extent=(lo, hi, lo, hi))
        ax.plot([lo, hi], [lo, hi], "k--", lw=1)
        r2 = res[name]["colour_Lab"]["r2"]
        ax.set(title=f"{name}\ncolour-only model, grouped CV (R² log-space {r2:.2f})", xlabel="predicted", ylabel="lab")
    for ax in axes.ravel()[len(preds_for_plot):]:
        ax.axis("off")
    fig.tight_layout()
    fig.savefig(FIG / "study_a2_colour_model_vs_lab.png", dpi=120)
    plt.close(fig)
    return res


# ---------------------------------------------------------------------------
# A3. Regional transfer: train on one continent's data, test on another
# ---------------------------------------------------------------------------
def study_a3(d: pd.DataFrame) -> dict:
    s = d[d.topsoil & d.mineral]
    eu = s[s.dataset.str.startswith("LUCAS")]
    us = s[s.dataset == "KSSL.SSL"]
    world = s[s.dataset == "ICRAF.ISRIC"]
    res = {}
    for name, col, tf in [("organic_carbon_pct", "oc_pct", "log1p"), ("ph_h2o", "ph_h2o", None)]:
        r = {}
        for tr_name, tr in [("Europe_LUCAS", eu), ("USA_KSSL", us)]:
            trm = tr[col].notna()
            Xtr = tr.loc[trm, COLOUR].to_numpy(np.float32)
            ytr = tr.loc[trm, col].values
            ytr = np.log1p(ytr) if tf else ytr
            mdl = lgb.LGBMRegressor(**LGB_REG).fit(Xtr, ytr)
            for te_name, te in [("Europe_LUCAS", eu), ("USA_KSSL", us), ("Global_tropics_ICRAF", world)]:
                if te_name == tr_name:
                    continue
                tem = te[col].notna()
                if tem.sum() < 50:
                    continue
                yte = te.loc[tem, col].values
                yte = np.log1p(yte) if tf else yte
                p = mdl.predict(te.loc[tem, COLOUR].to_numpy(np.float32))
                r[f"train_{tr_name}__test_{te_name}"] = {k: round(v, 4) if isinstance(v, float) else v
                                                         for k, v in reg_metrics(yte, p).items()}
        res[name] = r
    return res


def main() -> None:
    d = load()
    report = {
        "source": "Open Soil Spectral Library v1.2 (CC-BY 4.0), vis-NIR L0 + soillab L1 + soilsite L0",
        "colour_definition": "CIE 1931 2°, D65, 400–780 nm reflectance -> XYZ -> CIELAB / sRGB",
        "unit_assumptions": {"mg/kg -> kg/ha": MGKG_TO_KGHA, "K cmol/kg -> mg/kg": K_CMOL_TO_MGKG},
        "rows_total": int(len(d)), "rows_topsoil_mineral": int((d.topsoil & d.mineral).sum()),
        "datasets": d.dataset.value_counts().to_dict(),
    }
    print("A1 ...", flush=True)
    report["A1_shipped_heuristics_vs_lab"] = study_a1(d)
    print(json.dumps(report["A1_shipped_heuristics_vs_lab"], indent=1)[:3000], flush=True)
    print("A3 ...", flush=True)
    report["A3_regional_transfer_colour_model"] = study_a3(d)
    print(json.dumps(report["A3_regional_transfer_colour_model"], indent=1), flush=True)
    print("A2 ...", flush=True)
    report["A2_grouped_cv"] = study_a2(d)
    (REPORTS / "study_a_ossl.json").write_text(json.dumps(report, indent=2))
    print("written", REPORTS / "study_a_ossl.json")


if __name__ == "__main__":
    main()
