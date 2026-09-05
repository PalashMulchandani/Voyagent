"""Kaggle Notebook baseline for ranking hotel search results.

This script targets the Expedia Hotel / Personalized Sort style dataset:

    /kaggle/input/datasets/vijeetnigam26/expedia-hotel/train.csv

Each row is one hotel candidate shown for one search event. The model predicts
the probability that a candidate hotel will be booked, then uses that score to
rank hotels within the same search result set.

This is intentionally a small, reproducible baseline. It does not perform live
availability checks and should be combined with a supplier API before any real
booking flow is shown to users.
"""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import average_precision_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline


TRAIN_PATH = Path("/kaggle/input/datasets/vijeetnigam26/expedia-hotel/train.csv")
WORKING_ROOT = Path("/kaggle/working")
SAMPLE_ROWS = 300_000

TARGET = "booking_bool"
EXCLUDE_COLUMNS = {
    "booking_bool",
    "click_bool",
    "gross_bookings_usd",
    "position",
}
PROPERTY_ID_COLUMNS = {"srch_id", "prop_id"}


def pick_features(frame: pd.DataFrame) -> list[str]:
    """Select only features that are known before the user books."""

    numeric_columns = frame.select_dtypes(include=["number", "bool"]).columns
    return [
        column
        for column in numeric_columns
        if column not in EXCLUDE_COLUMNS and column not in PROPERTY_ID_COLUMNS
    ]


frame = pd.read_csv(TRAIN_PATH, nrows=SAMPLE_ROWS)
print(f"Loaded sample rows: {len(frame):,}")
print(f"Columns: {len(frame.columns)}")

if TARGET not in frame.columns:
    raise ValueError(f"Expected target column {TARGET!r}, got {list(frame.columns)}")

features = pick_features(frame)
print(f"Using {len(features)} numeric ranking features")
print(features)

x_train, x_val, y_train, y_val = train_test_split(
    frame[features],
    frame[TARGET],
    test_size=0.2,
    random_state=42,
    stratify=frame[TARGET],
)

model = Pipeline(
    steps=[
        ("impute", SimpleImputer(strategy="median")),
        (
            "classifier",
            HistGradientBoostingClassifier(
                max_iter=120,
                learning_rate=0.08,
                l2_regularization=0.05,
                random_state=42,
            ),
        ),
    ]
)

model.fit(x_train, y_train)
probabilities = model.predict_proba(x_val)[:, 1]
roc_auc = roc_auc_score(y_val, probabilities)
avg_precision = average_precision_score(y_val, probabilities)

example_search_id = frame["srch_id"].iloc[0]
example = frame[frame["srch_id"] == example_search_id].copy()
example["booking_probability"] = model.predict_proba(example[features])[:, 1]
example_ranking = (
    example[
        [
            "srch_id",
            "prop_id",
            "booking_probability",
            "price_usd",
            "prop_starrating",
            "prop_review_score",
            "promotion_flag",
        ]
    ]
    .sort_values("booking_probability", ascending=False)
    .head(10)
)

artifact_path = WORKING_ROOT / "hotel_property_ranker.joblib"
metrics_path = WORKING_ROOT / "personalized_sort_metrics.json"
example_path = WORKING_ROOT / "example_property_ranking.csv"

joblib.dump(model, artifact_path)
metrics_path.write_text(
    json.dumps(
        {
            "dataset": str(TRAIN_PATH),
            "sample_rows": SAMPLE_ROWS,
            "target": TARGET,
            "features": features,
            "roc_auc": float(roc_auc),
            "average_precision": float(avg_precision),
            "notes": [
                "This ranks hotel candidates from a search result set.",
                "It does not prove live API availability.",
                "Production should map live provider hotel attributes into these features before scoring.",
            ],
        },
        indent=2,
    )
)
example_ranking.to_csv(example_path, index=False)

print(f"ROC AUC: {roc_auc:.4f}")
print(f"Average precision: {avg_precision:.4f}")
print(f"Saved model: {artifact_path}")
print(f"Saved metrics: {metrics_path}")
print(f"Saved example ranking: {example_path}")
print(example_ranking)
