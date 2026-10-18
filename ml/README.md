# SAWA `ml/` — data, studies and trained models

A Python workspace kept separate from the Next.js app (AI-SAWA-001 §5). Nothing
here is wired into the app. Results and their limits are written up in
[`reports/FINDINGS.md`](reports/FINDINGS.md).

## What is here

| Study | Question | Script | Report |
|---|---|---|---|
| A | Do SAWA's shipped colour formulas match lab values? What can colour predict at all? | `01_prepare_ossl.py`, `02_ossl_feasibility.py` | `reports/study_a_ossl.json` |
| B | Real phone photos → lab organic carbon, within and across phones | `03_phone_soc.py` | `reports/study_b_phone_soc.json` |
| C | Does the shipped validation gate reject non-soil photos? Can a trained gate do better? (AI-SAWA M-1) | `04_build_gate_dataset.py`, `05_gate_tabular.py`, `06_train_gate_cnn.py` | `reports/study_c_gate_*.json` |
| D | Visual moisture class (AI-SAWA M-3), and what a leaky split does to the score | `07_moisture.py` | `reports/study_d_moisture.json` |

`gate/run_sawa_gate.mjs` runs the app's **unmodified** `src/lib/image-validation.ts`
under Node (≥ 23, native TypeScript stripping), so the shipped gate is measured
directly rather than through a re-implementation.

## Data sources

None of the data is committed (`.gitignore`); the scripts expect it under `data/raw/`.

| Source | What | Licence | Where |
|---|---|---|---|
| Open Soil Spectral Library v1.2 | 64,644 lab-analysed soil layers with vis-NIR spectra (KSSL, LUCAS, ICRAF-ISRIC) | CC-BY 4.0 | `https://storage.googleapis.com/soilspec4gg-public/ossl_{visnir_L0,soillab_L1,soilsite_L0}_v1.2.csv.gz` |
| Azevedo et al. 2026 | 84 soil samples × 4 smartphones, lab SOC | CC-BY 4.0 (code MIT) | [Zenodo 10.5281/zenodo.22876123](https://doi.org/10.5281/zenodo.22876123) |
| Soil Moisture Dataset (Mendeley) | 1,177 field phone photos of soil, Wet / Moderate / Dry | CC-BY 4.0 | [10.17632/skcc44yvvg.2](https://doi.org/10.17632/skcc44yvvg.2) |
| COCO 2017 val | Everyday photos (non-soil). Training uses only images licensed CC-BY / CC-BY-SA / public domain / US-gov; the rest are evaluation-only | per image; annotations CC-BY 4.0 | `images.cocodataset.org` |
| CC0 Textures (`nyuuzyou/cc0-textures`, shards 00–02) | Material albedo maps (wood, brick, fabric, metal…) as hard negatives | CC0 1.0 | Hugging Face |

Attribution for the CC-BY sources is required wherever a trained model or its
results are published.

## Reproduce

```bash
python -m venv ml/.venv
ml/.venv/Scripts/python -m pip install -r ml/requirements.txt
# (CUDA) ml/.venv/Scripts/python -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu126
cd ml
python scripts/01_prepare_ossl.py          # ~5 min, ~1.5 GB RAM peak
python scripts/02_ossl_feasibility.py      # ~1 h on 6 cores
python scripts/03_phone_soc.py             # ~30 min
python scripts/04_build_gate_dataset.py    # coco coco_eval cc0 mendeley zenodo
python scripts/04_build_gate_dataset.py --combine
python scripts/05_gate_tabular.py          # needs node on PATH
python scripts/06_train_gate_cnn.py        # GPU recommended
python scripts/07_moisture.py
```

All randomness is seeded. Cross-validation is grouped so that one location,
one soil sample (all its phone shots) or one capture session never appears in
both training and test data.
