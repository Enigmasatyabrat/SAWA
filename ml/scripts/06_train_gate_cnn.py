"""Study C2 — a small CNN "is this a usable soil close-up?" gate (AI-SAWA M-1).

MobileNetV3-Small (ImageNet weights, torchvision) fine-tuned on the gate
dataset built by 04_build_gate_dataset.py, then exported to ONNX for
onnxruntime-web (ADR-014). Evaluation mirrors 05_gate_tabular.py: the same
group-aware splits, plus a leave-one-source-out test so a source the model
never saw (e.g. a different country's phone photos) is measured honestly.

Output: artefacts/sawa_gate_mnv3s.onnx, reports/study_c_gate_cnn.json
"""
from __future__ import annotations

import json
import sys
import time
from pathlib import Path

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from sklearn.metrics import roc_auc_score
from torch.utils.data import DataLoader, Dataset
from torchvision import models, transforms

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
GATE = ROOT / "data" / "processed" / "gate"
ART = ROOT / "artefacts"
ART.mkdir(exist_ok=True)
REPORTS = ROOT / "reports"
DEV = "cuda" if torch.cuda.is_available() else "cpu"
SIZE = 224
MEAN, STD = [0.485, 0.456, 0.406], [0.229, 0.224, 0.225]


class GateSet(Dataset):
    def __init__(self, imgs: np.ndarray, labels: np.ndarray, idx: np.ndarray, train: bool):
        self.imgs, self.labels, self.idx = imgs, labels, idx
        aug = [transforms.ToPILImage(),
               transforms.RandomResizedCrop(SIZE, scale=(0.5, 1.0), ratio=(0.75, 1.33)),
               transforms.RandomHorizontalFlip(), transforms.RandomVerticalFlip(),
               transforms.ColorJitter(brightness=0.25, contrast=0.2, saturation=0.15, hue=0.02)]
        plain = [transforms.ToPILImage(), transforms.Resize((SIZE, SIZE))]
        self.tf = transforms.Compose((aug if train else plain) + [transforms.ToTensor(), transforms.Normalize(MEAN, STD)])

    def __len__(self):
        return len(self.idx)

    def __getitem__(self, i):
        j = self.idx[i]
        return self.tf(self.imgs[j]), torch.tensor(self.labels[j], dtype=torch.float32)


def make_model() -> nn.Module:
    m = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.IMAGENET1K_V1)
    m.classifier[3] = nn.Linear(m.classifier[3].in_features, 1)
    return m


def train(imgs, labels, tr_idx, va_idx, epochs=8, bs=64, lr=3e-4, seed=0):
    torch.manual_seed(seed)
    np.random.seed(seed)
    model = make_model().to(DEV)
    pos = labels[tr_idx].mean()
    # weight the rarer class so the gate is not lazy on either side
    loss_fn = nn.BCEWithLogitsLoss(pos_weight=torch.tensor((1 - pos) / max(pos, 1e-6), device=DEV))
    opt = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=lr, total_steps=epochs * int(np.ceil(len(tr_idx) / bs)))
    dl = DataLoader(GateSet(imgs, labels, tr_idx, True), batch_size=bs, shuffle=True, num_workers=0, drop_last=True)
    for ep in range(epochs):
        model.train()
        t0, tot = time.time(), 0.0
        for x, y in dl:
            x, y = x.to(DEV, non_blocking=True), y.to(DEV)
            opt.zero_grad()
            loss = loss_fn(model(x).squeeze(1), y)
            loss.backward()
            opt.step()
            sched.step()
            tot += loss.item() * len(y)
        msg = f"  epoch {ep + 1}/{epochs} loss {tot / len(dl.dataset):.4f} ({time.time() - t0:.0f}s)"
        if va_idx is not None and len(va_idx):
            p = predict(model, imgs, va_idx)
            if len(np.unique(labels[va_idx])) == 2:
                msg += f" val AUC {roc_auc_score(labels[va_idx], p):.4f}"
        print(msg, flush=True)
    return model


@torch.no_grad()
def predict(model, imgs, idx, bs=128) -> np.ndarray:
    model.eval()
    dl = DataLoader(GateSet(imgs, np.zeros(len(imgs)), idx, False), batch_size=bs, shuffle=False, num_workers=0)
    out = [torch.sigmoid(model(x.to(DEV)).squeeze(1)).cpu().numpy() for x, _ in dl]
    return np.concatenate(out)


def rates(y, p, thr):
    acc = p >= thr
    return {"soil_accepted_rate": round(float(acc[y == 1].mean()), 4) if (y == 1).any() else None,
            "non_soil_accepted_rate": round(float(acc[y == 0].mean()), 4) if (y == 0).any() else None}


def main() -> None:
    meta = pd.read_json(GATE / "meta.json")
    imgs = np.load(GATE / "images_224.npy", mmap_mode="r")
    labels = meta["label"].to_numpy().astype(np.float32)
    folds = meta["fold"].to_numpy()
    print("device:", DEV, "| images:", len(meta), "| soil share:", round(float(labels.mean()), 3), flush=True)
    report = {"model": "MobileNetV3-Small (torchvision ImageNet1K_V1), fine-tuned, 224x224 squashed input"}

    # C2a: 5-fold group CV -> out-of-fold probabilities (comparable with the tabular gate)
    oof = np.zeros(len(meta))
    ev = np.where(folds < 0)[0]  # evaluation-only rows: never trained on
    for f in range(5):
        te = np.where(folds == f)[0]
        tr = np.where((folds != f) & (folds >= 0))[0]
        print(f"fold {f}: train {len(tr)} test {len(te)}", flush=True)
        model = train(imgs, labels, tr, te)
        oof[te] = predict(model, imgs, te)
        if len(ev):
            oof[ev] += predict(model, imgs, ev) / 5
    meta["cnn_prob"] = oof
    meta[["id", "source", "label", "fold", "cnn_prob"]].to_json(REPORTS / "gate_cnn_oof.json", orient="records")
    # threshold chosen on OOF to keep >=97% of soil photos (a gate that rejects good photos is unusable)
    trn = folds >= 0
    thr = float(np.quantile(oof[(labels == 1) & trn], 0.03))
    report["oof_auc_trainable_rows"] = round(float(roc_auc_score(labels[trn], oof[trn])), 4)
    report["threshold_keep_97pct_soil"] = round(thr, 4)
    report["oof_at_threshold"] = rates(labels, oof, thr)
    report["oof_by_source"] = {s: rates(labels[g.index], oof[g.index], thr) for s, g in meta.groupby("source")}

    # C2b: leave-one-positive-source-out
    lo = {}
    for src in meta.loc[meta.label == 1, "source"].unique():
        te = np.where(meta.source == src)[0]
        tr = np.where((meta.source != src) & (meta.fold >= 0))[0]
        if labels[tr].sum() == 0:
            continue  # no other soil source to learn from
        print(f"leave out {src}: train {len(tr)}", flush=True)
        model = train(imgs, labels, tr, None)
        p = predict(model, imgs, te)
        lo[src] = {"n": int(len(te)), "soil_accepted_rate_at_threshold": round(float((p >= thr).mean()), 4),
                   "median_prob": round(float(np.median(p)), 4)}
    report["leave_one_soil_source_out"] = lo

    # Final model on all data -> ONNX
    print("final model on all data", flush=True)
    model = train(imgs, labels, np.where(folds >= 0)[0], None).eval().cpu()
    (ART / "checkpoints").mkdir(exist_ok=True)
    torch.save(model.state_dict(), ART / "checkpoints" / "sawa_gate_mnv3s.pt")
    dummy = torch.randn(1, 3, SIZE, SIZE)
    onnx_path = ART / "sawa_gate_mnv3s.onnx"
    torch.onnx.export(model, (dummy,), onnx_path, input_names=["image"], output_names=["logit"],
                      dynamic_shapes=({0: torch.export.Dim("batch", min=1, max=64)},), opset_version=18,
                      external_data=False)
    report["onnx"] = {"path": str(onnx_path.relative_to(ROOT)), "bytes": onnx_path.stat().st_size,
                      "input": "float32 [N,3,224,224], RGB, ImageNet mean/std normalised, image squashed to 224x224",
                      "output": "logit; probability = sigmoid(logit)", "threshold": round(thr, 4)}
    # parity check torch vs onnxruntime
    import onnxruntime as ort
    sess = ort.InferenceSession(str(onnx_path), providers=["CPUExecutionProvider"])
    x = torch.randn(4, 3, SIZE, SIZE)
    diff = np.abs(sess.run(None, {"image": x.numpy()})[0] - model(x).detach().numpy()).max()
    report["onnx"]["max_abs_logit_diff_vs_torch"] = float(diff)
    (REPORTS / "study_c_gate_cnn.json").write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=1))


if __name__ == "__main__":
    main()
