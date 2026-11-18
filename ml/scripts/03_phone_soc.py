"""Study B — real smartphone photos with lab organic carbon.

Data: Azevedo et al. (2026), Zenodo 10.5281/zenodo.22876123, CC-BY 4.0.
84 soil samples x 4 phones, lab SOC (g/kg). Features: the authors' published
masked histograms (BGR, HSV, Lab, gray; GLCM texture), reduced to compact
summary statistics so the model stays small enough for n = 84.

Questions:
  B1. Within one phone: how well does colour predict SOC and the Soil Health
      Card OC band? (repeated, stratified 5-fold CV by sample)
  B2. Across phones: train on one phone, test on another, with no sample in
      both train and test.
  B3. What does SAWA's own darkness score (its "N" number) track here?
  B4. Calibrated uncertainty: split-conformal prediction sets for the OC band.

Output: reports/study_b_phone_soc.json, reports/figures/study_b_*.png
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import matplotlib
import numpy as np
import pandas as pd
from scipy.stats import spearmanr
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import RidgeCV
from sklearn.model_selection import StratifiedKFold
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from sawa_ml.evaluation import cls_metrics, reg_metrics  # noqa: E402
from sawa_ml.soil_science import SHC_OC_PCT, band3  # noqa: E402

PKG = ROOT / "data" / "raw" / "zenodo_soc" / "pkg" / "soc_data_code" / "data"
REPORTS = ROOT / "reports"
FIG = REPORTS / "figures"
FIG.mkdir(parents=True, exist_ok=True)
DEVICES = {"bruno": 1, "felipe": 2, "pedro": 3, "rafael": 4}
N_REPEATS = 20


def hist_stats(h: np.ndarray, lo: float = 0, hi: float = 256) -> list[float]:
    """Weighted mean, std, and 10/50/90th percentiles of a 256-bin histogram."""
    centres = lo + (np.arange(len(h)) + 0.5) * (hi - lo) / len(h)
    w = np.clip(h, 0, None)
    w = w / w.sum()
    mean = float((w * centres).sum())
    std = float(np.sqrt((w * (centres - mean) ** 2).sum()))
    cdf = np.cumsum(w)
    pct = [float(centres[np.searchsorted(cdf, q)]) for q in (0.1, 0.5, 0.9)]
    return [mean, std, *pct]


def device_features(a: np.lib.npyio.NpzFile, dev: str) -> tuple[pd.DataFrame, pd.DataFrame]:
    rows_c, rows_t = [], []
    for i in range(a["ids"].shape[0]):
        c = []
        for block, chans, ranges in [("bgr", "BGR", [(0, 256)] * 3), ("hsv", "HSV", [(0, 180), (0, 256), (0, 256)]),
                                     ("lab", "Lab", [(0, 256)] * 3)]:
            hb = a[f"{dev}__{block}"][i].reshape(3, 256)
            for k in range(3):
                c += hist_stats(hb[k], *ranges[k])
        rows_c.append(c)
        rows_t.append(hist_stats(a[f"{dev}__gray"][i]) + list(a[f"{dev}__glcm"][i]))
    names_c = [f"{blk}{ch}_{s}" for blk, chs in [("bgr", "BGR"), ("hsv", "HSV"), ("lab", "Lab")]
               for ch in chs for s in ("mean", "std", "p10", "p50", "p90")]
    colour = pd.DataFrame(rows_c, columns=names_c)
    texture = pd.DataFrame(rows_t, columns=[f"gray_{s}" for s in ("mean", "std", "p10", "p50", "p90")]
                           + [f"glcm_{j}" for j in range(a[f"{dev}__glcm"].shape[1])])
    return colour, texture


def models():
    return {
        "ridge": make_pipeline(StandardScaler(), RidgeCV(alphas=np.logspace(-2, 3, 30))),
        "random_forest": RandomForestRegressor(n_estimators=500, min_samples_leaf=3, max_features=0.33,
                                               random_state=0, n_jobs=6),
    }


def repeated_cv(X_tr_src: np.ndarray, X_te_src: np.ndarray, y: np.ndarray, model_name: str,
                n_repeats: int = N_REPEATS):
    """Out-of-fold predictions repeated n_repeats times.

    X_tr_src is the phone used for training, X_te_src the phone predicted.
    Rows are samples; folds split *samples*, so a sample never trains and tests.
    """
    strata = pd.qcut(y, 4, labels=False)
    preds = np.zeros((n_repeats, len(y)))
    for r in range(n_repeats):
        for tr, te in StratifiedKFold(5, shuffle=True, random_state=1000 + r).split(X_tr_src, strata):
            m = models()[model_name].fit(X_tr_src[tr], y[tr])
            preds[r, te] = m.predict(X_te_src[te])
    return preds


def summarise(y: np.ndarray, preds: np.ndarray) -> dict:
    per = [reg_metrics(y, p) for p in preds]
    yb = band3(y / 10, *SHC_OC_PCT)
    cls = [cls_metrics(yb, band3(p / 10, *SHC_OC_PCT)) for p in preds]
    out = {}
    for k in ("r2", "rmse", "spearman"):
        v = np.array([m[k] for m in per])
        out[k] = {"median": round(float(np.median(v)), 3), "p25": round(float(np.percentile(v, 25)), 3),
                  "p75": round(float(np.percentile(v, 75)), 3)}
    sd = np.std(y, ddof=1)
    out["rpd_median"] = round(float(sd / out["rmse"]["median"]), 3)
    for k in ("accuracy", "macro_f1"):
        v = np.array([m[k] for m in cls])
        out[f"oc_band_{k}"] = {"median": round(float(np.median(v)), 3), "p25": round(float(np.percentile(v, 25)), 3),
                               "p75": round(float(np.percentile(v, 75)), 3)}
    return out


def conformal_band_sets(X: np.ndarray, y: np.ndarray, alpha: float = 0.1, n_repeats: int = 50) -> dict:
    """Split-conformal (LAC score) sets for the 3 OC bands: coverage and mean set size."""
    yb = band3(y / 10, *SHC_OC_PCT)
    rng = np.random.default_rng(0)
    cover, size, singleton = [], [], []
    for r in range(n_repeats):
        idx = rng.permutation(len(y))
        tr, cal, te = idx[:42], idx[42:63], idx[63:]
        clf = RandomForestClassifier(n_estimators=500, min_samples_leaf=2, random_state=r, n_jobs=6).fit(X[tr], yb[tr])
        cls_index = {c: i for i, c in enumerate(clf.classes_)}

        def proba_full(Xp):
            p = clf.predict_proba(Xp)
            full = np.zeros((len(Xp), 3))
            for c, i in cls_index.items():
                full[:, c] = p[:, i]
            return full

        pc = proba_full(X[cal])
        scores = 1 - pc[np.arange(len(cal)), yb[cal]]
        q = np.quantile(scores, min(1.0, np.ceil((len(cal) + 1) * (1 - alpha)) / len(cal)), method="higher")
        sets = (1 - proba_full(X[te])) <= q
        cover.append(sets[np.arange(len(te)), yb[te]].mean())
        size.append(sets.sum(1).mean())
        singleton.append((sets.sum(1) == 1).mean())
    return {"target_coverage": 1 - alpha, "empirical_coverage": round(float(np.mean(cover)), 3),
            "mean_set_size": round(float(np.mean(size)), 3), "share_single_band_answers": round(float(np.mean(singleton)), 3)}


def main() -> None:
    a = np.load(PKG / "aligned_input.npz")
    y = a["y"].astype(float)  # SOC g/kg
    ref = pd.read_csv(PKG / "soc_reference.csv", float_precision="round_trip").set_index("sample_id")
    assert np.allclose(ref.loc[a["ids"], "SOC_g_kg"].values, y, atol=1e-3)

    feats = {dev: device_features(a, dev) for dev in DEVICES}
    report = {"source": "Azevedo et al. 2026, Zenodo 10.5281/zenodo.22876123 (CC-BY 4.0)",
              "n_samples": int(len(y)), "soc_g_kg": {k: round(float(v), 2) for k, v in pd.Series(y).describe().items()},
              "oc_band_counts_low_med_high": np.bincount(band3(y / 10, *SHC_OC_PCT), minlength=3).tolist(),
              "protocol": f"{N_REPEATS}x repeated stratified 5-fold CV by sample; medians and IQR over repeats"}

    # B1 within-phone
    b1 = {}
    base = np.array([[np.mean(np.delete(y, i))] * 1 for i in range(len(y))]).ravel()
    b1["baseline_leave_one_out_mean"] = summarise(y, base[None, :])
    for dev in DEVICES:
        col, tex = feats[dev]
        for fset, X in [("colour", col.values), ("colour+texture", np.hstack([col.values, tex.values]))]:
            for mname in ("ridge", "random_forest"):
                p = repeated_cv(X, X, y, mname)
                b1[f"{dev}|{fset}|{mname}"] = summarise(y, p)
                print("B1", dev, fset, mname, b1[f"{dev}|{fset}|{mname}"]["r2"], flush=True)
    report["B1_within_phone"] = b1

    # B2 cross-phone (colour + texture, random forest)
    b2 = {}
    for dtr in DEVICES:
        for dte in DEVICES:
            if dtr == dte:
                continue
            Xtr = np.hstack([v.values for v in feats[dtr]])
            Xte = np.hstack([v.values for v in feats[dte]])
            p = repeated_cv(Xtr, Xte, y, "random_forest", n_repeats=10)
            b2[f"train_{dtr}__test_{dte}"] = summarise(y, p)
            print("B2", dtr, dte, b2[f"train_{dtr}__test_{dte}"]["r2"], flush=True)
    report["B2_cross_phone"] = b2

    # B3 SAWA darkness score on real phone photos
    b3 = {}
    for dev in DEVICES:
        col, _ = feats[dev]
        r, g, b = col["bgrR_mean"], col["bgrG_mean"], col["bgrB_mean"]
        dark = 1 - (r + g + b) / 765
        b3[dev] = {"spearman_darkness_vs_soc": round(float(spearmanr(dark, y).statistic), 3),
                   "sawa_n_score_range": [round(float(np.clip(dark * 100, 10, 150).min()), 1),
                                          round(float(np.clip(dark * 100, 10, 150).max()), 1)],
                   "sawa_ph_formula_range": [round(float((7.5 - 2 * dark).min()), 2), round(float((7.5 - 2 * dark).max()), 2)]}
    darks = np.vstack([1 - (feats[d][0]["bgrR_mean"] + feats[d][0]["bgrG_mean"] + feats[d][0]["bgrB_mean"]) / 765
                       for d in DEVICES])
    b3["same_sample_darkness_spread_across_phones"] = {
        "mean_abs_diff_in_sawa_n_score": round(float(np.mean(np.ptp(darks * 100, axis=0))), 2),
        "note": "How much SAWA's N score for the SAME soil changes just by switching phone."}
    report["B3_sawa_darkness_on_phone_photos"] = b3

    # B4 conformal OC-band sets (pooled colour+texture per phone)
    report["B4_conformal_oc_band"] = {dev: conformal_band_sets(np.hstack([v.values for v in feats[dev]]), y)
                                      for dev in DEVICES}

    # figure: within-phone OOF predictions, best phone
    best = max((k for k in b1 if "|" in k), key=lambda k: b1[k]["r2"]["median"])
    dev, fset, mname = best.split("|")
    X = feats[dev][0].values if fset == "colour" else np.hstack([v.values for v in feats[dev]])
    p = repeated_cv(X, X, y, mname, n_repeats=5).mean(0)
    fig, ax = plt.subplots(1, 2, figsize=(11, 4.6))
    ax[0].scatter(p, y, s=18)
    ax[0].plot([0, 27], [0, 27], "k--", lw=1)
    for t in (5, 7.5):
        ax[0].axhline(t, color="grey", lw=.6)
        ax[0].axvline(t, color="grey", lw=.6)
    ax[0].set(xlabel="predicted SOC (g/kg), out-of-fold", ylabel="lab SOC (g/kg)",
              title=f"Best within-phone model: {best}\n(grey lines = SHC OC band edges 0.5 / 0.75 %)")
    mat = np.array([[b2.get(f"train_{a_}__test_{b_}", b1.get(f"{a_}|colour+texture|random_forest"))["r2"]["median"]
                     for b_ in DEVICES] for a_ in DEVICES])
    im = ax[1].imshow(mat, cmap="RdYlGn", vmin=-0.5, vmax=0.6)
    ax[1].set_xticks(range(4), [f"test {d}" for d in DEVICES], rotation=30)
    ax[1].set_yticks(range(4), [f"train {d}" for d in DEVICES])
    for i in range(4):
        for j in range(4):
            ax[1].text(j, i, f"{mat[i, j]:.2f}", ha="center", va="center")
    ax[1].set_title("Median R² (diagonal = same phone)")
    fig.colorbar(im, ax=ax[1])
    fig.tight_layout()
    fig.savefig(FIG / "study_b_phone_soc.png", dpi=130)
    plt.close(fig)

    (REPORTS / "study_b_phone_soc.json").write_text(json.dumps(report, indent=2))
    print(json.dumps({k: report[k] for k in ("B3_sawa_darkness_on_phone_photos", "B4_conformal_oc_band")}, indent=1))


if __name__ == "__main__":
    main()
