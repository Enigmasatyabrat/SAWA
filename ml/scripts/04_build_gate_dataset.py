"""Build the image-gate dataset (AI-SAWA M-1): soil close-ups vs everything else.

Per source, every image is reduced exactly the way the app sees it
(AnalyzerClient: whole frame squashed to 150x150 by canvas drawImage; area
resampling here) and also to 224x224 for the CNN. Cached per source in
data/processed/gate/<source>.npz, then combined.

Sources (all permit reuse; licences recorded in meta):
  soil  zenodo_phone_soc   Azevedo et al. 2026, CC-BY 4.0 — 84 samples x 4 phones, lab dish
  soil  mendeley_moisture  Soil moisture dataset (Bangladesh), CC-BY 4.0 — field surfaces
  other coco_val2017       COCO 2017 val images whose per-image licence is CC-BY, CC-BY-SA,
                           public domain or US-gov; captions mentioning soil/dirt/mud/sand dropped

Usage: python scripts/04_build_gate_dataset.py [source ...]   (default: all available)
       python scripts/04_build_gate_dataset.py --combine
"""
from __future__ import annotations

import io
import json
import re
import sys
import zipfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
OUT = ROOT / "data" / "processed" / "gate"
OUT.mkdir(parents=True, exist_ok=True)

COCO_OK_LICENCES = {4: "CC-BY-2.0", 5: "CC-BY-SA-2.0", 7: "No known copyright restrictions", 8: "US Government Work"}
SOILY = re.compile(r"\b(dirt|soil|mud|muddy|sand|sandy|clay|gravel|earth|ground|plowed|ploughed|field)\b", re.I)


def reduce(img: Image.Image) -> tuple[np.ndarray, np.ndarray, int, int]:
    w0, h0 = img.size  # natural size, before any reduced-scale decode
    img.draft("RGB", (448, 448))  # fast JPEG decode at reduced scale; resampled properly below
    img = ImageOps.exif_transpose(img).convert("RGB")
    swapped = img.size[0] < img.size[1] and w0 > h0 or img.size[0] > img.size[1] and w0 < h0
    w, h = (h0, w0) if swapped else (w0, h0)
    g150 = np.asarray(img.resize((150, 150), Image.BOX), dtype=np.uint8)
    g224 = np.asarray(img.resize((224, 224), Image.BOX), dtype=np.uint8)
    return g150, g224, w, h


def save(name: str, rows: list[dict], g150: list, g224: list) -> None:
    np.savez(OUT / f"{name}.npz", g150=np.stack(g150), g224=np.stack(g224))
    (OUT / f"{name}.json").write_text(json.dumps(rows))
    print(f"{name}: {len(rows)} images", flush=True)


def build_coco() -> None:
    root = RAW / "coco"
    inst = json.loads((root / "annotations" / "instances_val2017.json").read_text())
    caps = json.loads((root / "annotations" / "captions_val2017.json").read_text())
    text = {}
    for c in caps["annotations"]:
        text.setdefault(c["image_id"], []).append(c["caption"])
    rows, a, b = [], [], []
    dropped = {"licence": 0, "soil_caption": 0}
    for im in inst["images"]:
        if im["license"] not in COCO_OK_LICENCES:
            dropped["licence"] += 1
            continue
        if any(SOILY.search(t) for t in text.get(im["id"], [])):
            dropped["soil_caption"] += 1
            continue
        g150, g224, w, h = reduce(Image.open(root / "val2017" / im["file_name"]))
        rows.append({"id": f"coco/{im['file_name']}", "source": "coco_val2017", "label": 0,
                     "group": f"coco/{im['id']}", "w": w, "h": h, "licence": COCO_OK_LICENCES[im["license"]]})
        a.append(g150)
        b.append(g224)
    print("coco dropped:", dropped)
    save("coco_val2017", rows, a, b)


def build_coco_eval() -> None:
    """COCO val images with non-commercial / no-derivatives licences: EVALUATION ONLY.

    Never used to train any model (eval_only=True keeps them out of every fold);
    they only widen the test of how often a gate accepts ordinary photos.
    """
    root = RAW / "coco"
    inst = json.loads((root / "annotations" / "instances_val2017.json").read_text())
    caps = json.loads((root / "annotations" / "captions_val2017.json").read_text())
    text = {}
    for c in caps["annotations"]:
        text.setdefault(c["image_id"], []).append(c["caption"])
    rows, a, b = [], [], []
    for im in inst["images"]:
        if im["license"] in COCO_OK_LICENCES or any(SOILY.search(t) for t in text.get(im["id"], [])):
            continue
        g150, g224, w, h = reduce(Image.open(root / "val2017" / im["file_name"]))
        rows.append({"id": f"coco_eval/{im['file_name']}", "source": "coco_eval_only", "label": 0,
                     "group": f"coco/{im['id']}", "w": w, "h": h, "licence": f"COCO licence id {im['license']}",
                     "eval_only": True})
        a.append(g150)
        b.append(g224)
    save("coco_eval_only", rows, a, b)


COLOUR_MAP = re.compile(r"(_color|basecolor|albedo|diffuse)", re.I)
GROUNDLIKE = re.compile(r"(soil|dirt|ground|mud|sand|gravel|rock|stone|pebble|grass|leaf|leaves|moss|forest|bark|"
                        r"terrain|cliff|clay|earth|lava|snow|ice)", re.I)


def build_cc0() -> None:
    """CC0 material albedo maps (wood, fabric, brick, metal...) as hard negatives.

    Ground-like materials are skipped entirely: a close-up of gravel or bark is
    neither a clean "soil" nor a clean "not soil" example. Each colour map gives
    the whole frame plus two random 40 % crops (different framings of one texture
    share a group, so they never straddle folds). Truncated shards are read up
    to the last complete member.
    """
    import tarfile
    rng = np.random.default_rng(0)
    rows, a, b = [], [], []
    skipped = {"groundlike": 0}
    for tar_path in sorted((RAW / "cc0_textures").glob("dataset_*.tar")):
        try:
            with tarfile.open(tar_path, "r|") as t:
                for m in t:
                    if not m.isfile() or not COLOUR_MAP.search(m.name) or not m.name.lower().endswith((".jpg", ".jpeg", ".png")):
                        continue
                    if GROUNDLIKE.search(m.name):
                        skipped["groundlike"] += 1
                        continue
                    img = Image.open(io.BytesIO(t.extractfile(m).read())).convert("RGB")
                    W, H = img.size
                    crops = [img]
                    for _ in range(2):
                        cw, ch = int(W * 0.4), int(H * 0.4)
                        x, y = rng.integers(0, W - cw), rng.integers(0, H - ch)
                        crops.append(img.crop((x, y, x + cw, y + ch)))
                    tex = m.name.split("-")[0]
                    for k, c in enumerate(crops):
                        g150, g224, w, h = reduce(c)
                        rows.append({"id": f"cc0/{tex}/{k}", "source": "cc0_material_textures", "label": 0,
                                     "group": f"cc0/{tex}", "w": w, "h": h, "licence": "CC0-1.0"})
                        a.append(g150)
                        b.append(g224)
        except (tarfile.ReadError, EOFError, OSError) as e:
            print(f"{tar_path.name}: stopped at a truncated member ({type(e).__name__})")
    print("cc0 skipped:", skipped)
    save("cc0_material_textures", rows, a, b)


def build_zenodo() -> None:
    root = RAW / "zenodo_soc"
    rows, a, b = [], [], []
    for d in (1, 2, 3, 4):
        with zipfile.ZipFile(root / f"images_device{d}.zip") as z:
            for name in sorted(n for n in z.namelist() if n.lower().endswith((".png", ".jpg", ".jpeg"))):
                # Photos show a Petri dish on white paper; the soil is the centre.
                # Keep a centred square of 30 % of the short side (well inside the
                # ~55 %-wide dish) = what a user filling the frame with soil sends.
                full = Image.open(io.BytesIO(z.read(name))).convert("RGB")
                W, H = full.size
                s = int(0.30 * min(W, H))
                crop = full.crop(((W - s) // 2, (H - s) // 2, (W - s) // 2 + s, (H - s) // 2 + s))
                g150, g224, w, h = reduce(crop)
                sid = Path(name).stem
                rows.append({"id": f"zenodo/d{d}/{sid}", "source": "zenodo_phone_soc", "label": 1,
                             "group": f"zenodo/{sid}", "device": d, "w": w, "h": h, "licence": "CC-BY-4.0"})
                a.append(g150)
                b.append(g224)
    save("zenodo_phone_soc", rows, a, b)


def mendeley_sessions(files: list[Path]) -> dict[Path, str]:
    """Capture sessions: same phone (filename prefix), shots < 5 min apart.

    Each session in this dataset holds a single moisture class, so sessions
    (not photos) are the unit of independence for any split.
    """
    import datetime as dt
    stamp = re.compile(r"^(IMG_|PXL_)?(\d{8})_(\d{6})")
    parsed = []
    for p in files:
        m = stamp.match(p.stem)
        dev = (m.group(1) or "SONY_").rstrip("_") if m else "unknown"
        t = dt.datetime.strptime(m.group(2) + m.group(3), "%Y%m%d%H%M%S") if m else dt.datetime.min
        parsed.append((dev, t, p))
    out, last, n = {}, {}, {}
    for dev, t, p in sorted(parsed):
        if dev not in last or (t - last[dev]).total_seconds() > 300:
            n[dev] = n.get(dev, 0) + 1
        last[dev] = t
        out[p] = f"{dev}-s{n[dev]}"
    return out


def build_mendeley() -> None:
    root = RAW / "mendeley_moisture"
    files = sorted(p for p in root.rglob("*") if p.suffix.lower() in (".jpg", ".jpeg", ".png")
                   and "before augmentation" in p.as_posix().lower())  # originals only, never augmented copies
    sessions = mendeley_sessions(files)
    rows, a, b = [], [], []
    for p in files:
        rel = p.relative_to(root).as_posix()
        moisture = next((m for m in ("Wet", "Moderate", "Dry") if f"/{m.lower()}/" in rel.lower()), "")
        g150, g224, w, h = reduce(Image.open(p))
        rows.append({"id": f"mendeley/{rel}", "source": "mendeley_moisture", "label": 1,
                     "group": f"mendeley/{sessions[p]}", "moisture": moisture,
                     "w": w, "h": h, "licence": "CC-BY-4.0"})
        a.append(g150)
        b.append(g224)
    save("mendeley_moisture", rows, a, b)


def combine() -> None:
    import pandas as pd
    from sklearn.model_selection import StratifiedGroupKFold
    metas, g150, g224 = [], [], []
    for js in sorted(OUT.glob("*.json")):
        if js.name == "meta.json" or js.name.startswith("_"):
            continue
        metas.append(pd.DataFrame(json.loads(js.read_text())))
        z = np.load(js.with_suffix(".npz"))
        g150.append(z["g150"])
        g224.append(z["g224"])
    meta = pd.concat(metas, ignore_index=True)
    g150, g224 = np.concatenate(g150), np.concatenate(g224)
    # stratify on source so every fold sees every source; group so a sample's
    # four phone shots (or a folder of near-identical shots) never straddle folds
    if "eval_only" not in meta:
        meta["eval_only"] = False
    meta["eval_only"] = meta["eval_only"].fillna(False).astype(bool)
    meta["fold"] = -1  # -1 = evaluation only, never trained on
    trainable = meta.index[~meta.eval_only]
    sub = meta.loc[trainable]
    for f, (_, te) in enumerate(StratifiedGroupKFold(5, shuffle=True, random_state=0)
                                .split(sub, sub["source"], sub["group"])):
        meta.loc[trainable[te], "fold"] = f
    g150.tofile(OUT / "grids150.bin")
    np.save(OUT / "images_224.npy", g224)
    meta.to_json(OUT / "meta.json", orient="records")
    print(meta.groupby(["source", "label"]).size().to_string())
    print(meta.groupby(["fold", "label"]).size().unstack().to_string())


if __name__ == "__main__":
    args = sys.argv[1:]
    if args == ["--combine"]:
        combine()
    else:
        builders = {"coco": build_coco, "coco_eval": build_coco_eval, "zenodo": build_zenodo,
                    "mendeley": build_mendeley, "cc0": build_cc0}
        for k in (args or builders):
            builders[k]()
