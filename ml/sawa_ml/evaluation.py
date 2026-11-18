"""Shared evaluation helpers: spatial groups, cluster bootstrap CIs, metrics."""
from __future__ import annotations

import numpy as np
import pandas as pd
from scipy.stats import spearmanr
from sklearn.metrics import balanced_accuracy_score, f1_score, mean_squared_error, r2_score


def spatial_groups(df: pd.DataFrame, cell_deg: float = 0.5) -> np.ndarray:
    """Group layers so no location appears in both train and test.

    With coordinates: a cell_deg grid cell (pedons and their neighbours share a
    cell). Without: the source project, so a profile's layers stay together.
    """
    has = df["lat"].notna() & df["lon"].notna()
    cell = (np.floor(df["lat"] / cell_deg).astype("Int64").astype(str) + "_"
            + np.floor(df["lon"] / cell_deg).astype("Int64").astype(str))
    proj = df["dataset"].astype(str) + "|" + df["project"].fillna("na").astype(str)
    g = np.where(has, df["dataset"].astype(str) + "|" + cell, proj)
    return pd.factorize(g)[0]


def reg_metrics(y: np.ndarray, p: np.ndarray) -> dict:
    return {
        "n": int(len(y)),
        "r2": float(r2_score(y, p)),
        "rmse": float(np.sqrt(mean_squared_error(y, p))),
        "spearman": float(spearmanr(y, p).statistic),
        "rpiq": float((np.percentile(y, 75) - np.percentile(y, 25)) / np.sqrt(mean_squared_error(y, p))),
    }


def cls_metrics(y: np.ndarray, p: np.ndarray) -> dict:
    return {
        "n": int(len(y)),
        "accuracy": float((y == p).mean()),
        "balanced_accuracy": float(balanced_accuracy_score(y, p)),
        "macro_f1": float(f1_score(y, p, average="macro")),
    }


def cluster_bootstrap(groups: np.ndarray, fn, n_boot: int = 200, seed: int = 0) -> tuple[float, float]:
    """95% CI of fn(idx) resampling whole groups (locations), not rows."""
    rng = np.random.default_rng(seed)
    uniq = np.unique(groups)
    by_g = pd.Series(np.arange(len(groups))).groupby(groups).apply(np.asarray).to_dict()
    vals = []
    for _ in range(n_boot):
        pick = rng.choice(uniq, size=len(uniq), replace=True)
        idx = np.concatenate([by_g[g] for g in pick])
        try:
            vals.append(fn(idx))
        except ValueError:
            continue
    lo, hi = np.percentile(vals, [2.5, 97.5])
    return float(lo), float(hi)
