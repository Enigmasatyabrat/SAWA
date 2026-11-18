"""Study D — visual soil-moisture class (AI-SAWA M-3) and how much a naive split lies.

Data: "Soil Moisture Dataset for Image Based Soil Classification" (Mendeley Data,
10.17632/skcc44yvvg.2, CC-BY 4.0): 1,177 original phone photos, Wet / Moderate / Dry.

The catch: the photos come from capture sessions and every session holds ONE
class (3 Sony sessions per class, plus a few other-phone shots, all Wet). A
photo-level random split — what the dataset card recommends — lets a model
learn "which session / light / patch of ground" instead of moisture.

We compare:
  naive   : 5-fold stratified split by photo (leaky)
  session : 3 folds, each holding out one whole session of every class
Models: tabular colour/texture stats (LightGBM) and a fine-tuned MobileNetV3-Small.

Output: reports/study_d_moisture.json
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import lightgbm as lgb
import numpy as np
import pandas as pd
import torch
from sklearn.metrics import balanced_accuracy_score, confusion_matrix, f1_score
from sklearn.model_selection import StratifiedKFold

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
GATE = ROOT / "data" / "processed" / "gate"
REPORTS = ROOT / "reports"
CLASSES = ["Dry", "Moderate", "Wet"]


def load():
    meta = pd.DataFrame(json.loads((GATE / "mendeley_moisture.json").read_text()))
    z = np.load(GATE / "mendeley_moisture.npz")
    meta["y"] = meta.moisture.map({c: i for i, c in enumerate(CLASSES)})
    return meta, z["g150"], z["g224"]


def session_folds(meta: pd.DataFrame) -> np.ndarray:
    """Fold k holds the k-th Sony session of each class; other-phone shots spread by session."""
    fold = np.full(len(meta), -1)
    for c in CLASSES:
        sess = sorted(meta.loc[(meta.moisture == c) & meta.group.str.contains("SONY"), "group"].unique())
        for k, s in enumerate(sess):
            fold[(meta.group == s).values] = k % 3
    others = sorted(meta.loc[fold < 0, "group"].unique())
    for k, s in enumerate(others):
        fold[(meta.group == s).values] = k % 3
    return fold


def scores(y, p):
    return {"accuracy": round(float((y == p).mean()), 4), "balanced_accuracy": round(float(balanced_accuracy_score(y, p)), 4),
            "macro_f1": round(float(f1_score(y, p, average="macro")), 4),
            "confusion_rows_true_DryModWet": confusion_matrix(y, p, labels=[0, 1, 2]).tolist()}


def run_tabular(X, y, folds):
    p = np.zeros(len(y), dtype=int)
    for f in np.unique(folds):
        tr, te = folds != f, folds == f
        m = lgb.LGBMClassifier(n_estimators=300, learning_rate=0.05, num_leaves=15, min_child_samples=20,
                               class_weight="balanced", random_state=0, verbose=-1).fit(X[tr], y[tr])
        p[te] = m.predict(X[te])
    return p


def run_cnn(g224, y, folds):
    gate_cnn = __import__("06_train_gate_cnn")
    import torch.nn as nn
    from torch.utils.data import DataLoader

    p = np.zeros(len(y), dtype=int)
    for f in np.unique(folds):
        tr, te = np.where(folds != f)[0], np.where(folds == f)[0]
        torch.manual_seed(0)
        model = gate_cnn.make_model()
        model.classifier[3] = nn.Linear(model.classifier[3].in_features, 3)
        model = model.to(gate_cnn.DEV)
        opt = torch.optim.AdamW(model.parameters(), lr=3e-4, weight_decay=1e-4)
        dl = DataLoader(gate_cnn.GateSet(g224, y.astype(np.float32), tr, True), batch_size=48, shuffle=True, drop_last=True)
        for ep in range(6):
            model.train()
            for x, t in dl:
                opt.zero_grad()
                loss = nn.functional.cross_entropy(model(x.to(gate_cnn.DEV)), t.long().to(gate_cnn.DEV))
                loss.backward()
                opt.step()
        model.eval()
        dl = DataLoader(gate_cnn.GateSet(g224, y.astype(np.float32), te, False), batch_size=96)
        with torch.no_grad():
            p[te] = np.concatenate([model(x.to(gate_cnn.DEV)).argmax(1).cpu().numpy() for x, _ in dl])
        print(f"  cnn fold {f}: acc {(p[te] == y[te]).mean():.3f}", flush=True)
    return p


def main():
    from importlib import import_module
    tab = import_module("05_gate_tabular")
    meta, g150, g224 = load()
    y = meta.y.values
    X = np.stack([tab.grid_features(g) for g in g150])
    naive = np.zeros(len(y), dtype=int)
    for f, (_, te) in enumerate(StratifiedKFold(5, shuffle=True, random_state=0).split(X, y)):
        naive[te] = f
    sess = session_folds(meta)
    report = {"n": int(len(y)), "class_counts": meta.moisture.value_counts().to_dict(),
              "sessions": meta.groupby("group").moisture.agg(["first", "size"]).reset_index().values.tolist(),
              "majority_baseline_accuracy": round(float(np.bincount(y).max() / len(y)), 4)}
    for split_name, folds in [("naive_photo_split", naive), ("held_out_sessions", sess)]:
        r = {"tabular_lightgbm": scores(y, run_tabular(X, y, folds))}
        print(split_name, "tabular", r["tabular_lightgbm"]["accuracy"], flush=True)
        r["cnn_mobilenetv3s"] = scores(y, run_cnn(g224, y, folds))
        print(split_name, "cnn", r["cnn_mobilenetv3s"]["accuracy"], flush=True)
        report[split_name] = r
    (REPORTS / "study_d_moisture.json").write_text(json.dumps(report, indent=2))
    print(json.dumps({k: v for k, v in report.items() if k != "sessions"}, indent=1))


if __name__ == "__main__":
    main()
