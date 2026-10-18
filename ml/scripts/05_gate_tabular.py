"""Study C1 — the shipped validation gate vs a trained gate on the same images.

1. Runs SAWA's real gate (src/lib/image-validation.ts, via ml/gate/run_sawa_gate.mjs)
   on every 150x150 grid in the gate dataset.
2. Trains a small gradient-boosted gate on cheap, browser-portable statistics
   of the same 150x150 grid (the shipped gate's own metrics + colour/texture
   summaries), using the dataset's group-aware folds.
3. Reports, per source: share of soil photos accepted, share of non-soil accepted.

Output: reports/study_c_gate_tabular.json, reports/gate_shipped_verdicts.json
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import cv2
import lightgbm as lgb
import numpy as np
import pandas as pd
from sklearn.metrics import roc_auc_score

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parent
GATE = ROOT / "data" / "processed" / "gate"
REPORTS = ROOT / "reports"
METRIC_KEYS = ["meanLuminance", "fractionNearBlack", "fractionNearWhite", "textureScore", "rgbStdDev",
               "avgHue", "avgSat", "avgVal", "soilHueFraction", "vegetationFraction", "skyWaterFraction"]


def run_shipped_gate(meta: pd.DataFrame) -> pd.DataFrame:
    tmp_meta = GATE / "_gate_meta.json"
    out = GATE / "_gate_out.json"
    tmp_meta.write_text(json.dumps([{"id": r.id, "w": int(r.w), "h": int(r.h)} for r in meta.itertuples()]))
    subprocess.run(["node", str(ROOT / "gate" / "run_sawa_gate.mjs"), str(GATE / "grids150.bin"), str(tmp_meta), str(out)],
                   check=True, cwd=REPO, stderr=subprocess.DEVNULL)
    res = pd.DataFrame(json.loads(out.read_text()))
    m = pd.json_normalize(res["metrics"])[METRIC_KEYS]
    return pd.concat([res[["id", "verdict", "confidence", "band", "reason"]], m], axis=1)


def grid_features(g: np.ndarray) -> np.ndarray:
    """Cheap statistics a browser can compute on the 150x150 grid (no ML runtime)."""
    hsv = cv2.cvtColor(g, cv2.COLOR_RGB2HSV).reshape(-1, 3).astype(np.float32)
    lab = cv2.cvtColor(g, cv2.COLOR_RGB2LAB).reshape(-1, 3).astype(np.float32)
    gray = cv2.cvtColor(g, cv2.COLOR_RGB2GRAY).astype(np.float32)
    f = []
    hue_hist = np.histogram(hsv[:, 0], bins=12, range=(0, 180))[0] / len(hsv)  # OpenCV hue 0-180
    f += list(hue_hist)
    for ch in (hsv[:, 1], hsv[:, 2], lab[:, 0], lab[:, 1], lab[:, 2]):
        f += [ch.mean(), ch.std(), *np.percentile(ch, [5, 50, 95])]
    for k in (1, 2, 4):  # gradient energy at three scales
        s = gray[::k, ::k]
        gx, gy = np.diff(s, axis=1)[:-1], np.diff(s, axis=0)[:, :-1]
        mag = np.sqrt(gx ** 2 + gy ** 2)
        f += [mag.mean(), np.percentile(mag, 90), (mag > 20).mean()]
    # spatial uniformity: how different the 3x3 tiles are (scenes vary, soil is homogeneous)
    tiles = [lab[:, 0].reshape(150, 150)[i:i + 50, j:j + 50].mean() for i in (0, 50, 100) for j in (0, 50, 100)]
    tiles_b = [lab[:, 2].reshape(150, 150)[i:i + 50, j:j + 50].mean() for i in (0, 50, 100) for j in (0, 50, 100)]
    f += [np.std(tiles), np.ptp(tiles), np.std(tiles_b)]
    # colourfulness (Hasler & Suesstrunk)
    r, gg, b = (g[..., i].astype(np.float32) for i in range(3))
    rg, yb = r - gg, 0.5 * (r + gg) - b
    f += [np.sqrt(rg.std() ** 2 + yb.std() ** 2) + 0.3 * np.sqrt(rg.mean() ** 2 + yb.mean() ** 2)]
    return np.array(f, dtype=np.float32)


def rates(y, accept):
    return {"soil_accepted_rate": round(float(accept[y == 1].mean()), 4) if (y == 1).any() else None,
            "non_soil_accepted_rate": round(float(accept[y == 0].mean()), 4) if (y == 0).any() else None,
            "n": int(len(y))}


def by_source(meta, accept):
    return {s: rates(meta.label.values[g.index], accept[g.index]) for s, g in meta.groupby("source")}


def main() -> None:
    meta = pd.read_json(GATE / "meta.json")
    grids = np.fromfile(GATE / "grids150.bin", dtype=np.uint8).reshape(-1, 150, 150, 3)
    assert len(grids) == len(meta)
    y = meta.label.values

    shipped = run_shipped_gate(meta)
    shipped.drop(columns=METRIC_KEYS).assign(source=meta.source, label=y).to_json(
        REPORTS / "gate_shipped_verdicts.json", orient="records")
    report = {"n": int(len(meta)), "counts": meta.groupby(["source", "label"]).size().astype(int)
              .reset_index().to_dict("records")}
    acc_ok = (shipped.verdict == "ok").values
    acc_not_rej = (shipped.verdict != "rejected").values
    report["shipped_gate"] = {
        "accept_rule": "verdict == ok (confidence >= 70 and no hard reject)",
        "overall": rates(y, acc_ok), "by_source": by_source(meta, acc_ok),
        "not_rejected_by_source": by_source(meta, acc_not_rej),
        "high_confidence_non_soil": int(((shipped.band == "high") & (shipped.verdict == "ok") & (y == 0)).sum()),
        "auc_of_confidence": round(float(roc_auc_score(y, shipped.confidence)), 4),
    }
    print(json.dumps(report["shipped_gate"], indent=1), flush=True)

    X = np.hstack([shipped[METRIC_KEYS].to_numpy(np.float32), np.stack([grid_features(g) for g in grids])])
    params = dict(n_estimators=400, learning_rate=0.03, num_leaves=15, min_child_samples=20, subsample=0.8,
                  subsample_freq=1, colsample_bytree=0.8, reg_lambda=1.0, random_state=0, verbose=-1)
    oof = np.zeros(len(y))
    ev = meta.fold.values < 0  # evaluation-only rows: never trained on
    for f in range(5):
        tr, te = (meta.fold.values != f) & ~ev, meta.fold.values == f
        m = lgb.LGBMClassifier(**params, class_weight="balanced").fit(X[tr], y[tr])
        oof[te] = m.predict_proba(X[te])[:, 1]
        oof[ev] += m.predict_proba(X[ev])[:, 1] / 5
    thr = float(np.quantile(oof[(y == 1) & ~ev], 0.03))  # keep 97 % of soil photos
    accept = oof >= thr
    report["trained_tabular_gate"] = {
        "features": f"{X.shape[1]} (11 shipped-gate metrics + {X.shape[1] - 11} grid statistics)",
        "oof_auc_trainable_rows": round(float(roc_auc_score(y[~ev], oof[~ev])), 4), "threshold_keep_97pct_soil": round(thr, 4),
        "overall": rates(y, accept), "by_source": by_source(meta, accept)}
    lo = {}
    for src in meta.loc[meta.label == 1, "source"].unique():
        tr, te = ((meta.source != src) & (meta.fold >= 0)).values, (meta.source == src).values
        if y[tr].sum() == 0:
            continue  # no other soil source to learn from
        m = lgb.LGBMClassifier(**params, class_weight="balanced").fit(X[tr], y[tr])
        p = m.predict_proba(X[te])[:, 1]
        lo[src] = {"n": int(te.sum()), "soil_accepted_rate_at_threshold": round(float((p >= thr).mean()), 4)}
    report["trained_tabular_gate"]["leave_one_soil_source_out"] = lo
    meta.assign(tab_prob=oof)[["id", "source", "label", "fold", "tab_prob"]].to_json(
        REPORTS / "gate_tabular_oof.json", orient="records")
    (REPORTS / "study_c_gate_tabular.json").write_text(json.dumps(report, indent=2))
    print(json.dumps(report["trained_tabular_gate"], indent=1))


if __name__ == "__main__":
    main()
