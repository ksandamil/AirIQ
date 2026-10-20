from pathlib import Path
import json
import numpy as np
import pandas as pd

from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingRegressor, RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.tree import DecisionTreeRegressor


MODEL_NAMES = [
    "Linear Regression",
    "Decision Tree",
    "Random Forest",
    "HistGradientBoosting",
]


class TrainOnlyIQRClipper(BaseEstimator, TransformerMixin):
    """Cap rare IQR extremes using limits fitted on training data only."""

    def __init__(self, max_outlier_percent=5.0, factor=1.5):
        self.max_outlier_percent = max_outlier_percent
        self.factor = factor

    def fit(self, X, y=None):
        X_df = pd.DataFrame(X).copy()
        self.columns_ = list(X_df.columns)
        self.bounds_ = {}

        for col in self.columns_:
            s = pd.to_numeric(X_df[col], errors="coerce")
            valid = s.dropna()
            if valid.empty:
                continue

            q1 = valid.quantile(0.25)
            q3 = valid.quantile(0.75)
            iqr = q3 - q1
            if pd.isna(iqr) or iqr == 0:
                continue

            low = q1 - self.factor * iqr
            high = q3 + self.factor * iqr
            outlier_count = int(((valid < low) | (valid > high)).sum())
            outlier_pct = outlier_count / len(valid) * 100

            if outlier_pct <= self.max_outlier_percent:
                self.bounds_[col] = (float(low), float(high))

        return self

    def transform(self, X):
        X_df = pd.DataFrame(X, columns=self.columns_).copy()
        for col, (low, high) in self.bounds_.items():
            X_df[col] = X_df[col].clip(low, high)
        return X_df.to_numpy()


def make_model(model_name):
    if model_name == "Linear Regression":
        return LinearRegression()
    if model_name == "Decision Tree":
        return DecisionTreeRegressor(
            max_depth=20,
            min_samples_leaf=5,
            random_state=42,
        )
    if model_name == "Random Forest":
        return RandomForestRegressor(
            n_estimators=150,
            max_depth=20,
            min_samples_leaf=3,
            random_state=42,
            n_jobs=-1,
        )
    if model_name == "HistGradientBoosting":
        return HistGradientBoostingRegressor(
            max_iter=200,
            learning_rate=0.08,
            max_leaf_nodes=31,
            l2_regularization=0.1,
            early_stopping=False,
            random_state=42,
        )
    raise ValueError(f"Unknown model: {model_name}")


def make_preprocessor(numeric_columns, categorical_columns, scale_numeric=False):
    try:
        encoder = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
    except TypeError:
        encoder = OneHotEncoder(handle_unknown="ignore", sparse=False)

    numeric_steps = [
        ("outlier_cap", TrainOnlyIQRClipper(max_outlier_percent=5.0, factor=1.5)),
        ("imputer", SimpleImputer(strategy="median")),
    ]
    if scale_numeric:
        numeric_steps.append(("scaler", StandardScaler()))

    categorical_steps = [
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", encoder),
    ]

    return ColumnTransformer(
        transformers=[
            ("numeric", Pipeline(numeric_steps), numeric_columns),
            ("categorical", Pipeline(categorical_steps), categorical_columns),
        ],
        remainder="drop",
        verbose_feature_names_out=False,
    )


def make_model_pipeline(model_name, numeric_columns, categorical_columns):
    # Scaling is useful for Linear Regression but unnecessary for tree models.
    scale_numeric = model_name == "Linear Regression"
    return Pipeline(
        steps=[
            (
                "preprocessing",
                make_preprocessor(
                    numeric_columns,
                    categorical_columns,
                    scale_numeric=scale_numeric,
                ),
            ),
            ("model", make_model(model_name)),
        ]
    )


def regression_metrics(y_true, y_pred):
    return {
        "MAE": float(mean_absolute_error(y_true, y_pred)),
        "RMSE": float(np.sqrt(mean_squared_error(y_true, y_pred))),
        "R2": float(r2_score(y_true, y_pred)),
    }


def model_input_columns(frame, target_column, feature_columns=None):
    drop_columns = ["No", "datetime", "target_datetime", "has_next_hour", target_column]
    if feature_columns is None:
        columns = [c for c in frame.columns if c not in drop_columns]
    else:
        columns = [c for c in feature_columns if c in frame.columns]
    categorical = [c for c in ["wd", "station", "season"] if c in columns]
    numeric = [c for c in columns if c not in categorical]
    return columns, numeric, categorical


def prepare_model_rows(feature_df, target_column, target_time_column, history_features):
    required = [target_column, target_time_column] + history_features
    mask = feature_df[target_column].notna() & feature_df[target_time_column].notna()
    mask &= feature_df[history_features].notna().all(axis=1)
    prepared = feature_df.loc[mask].copy()
    prepared = prepared.sort_values(["station", "datetime"]).reset_index(drop=True)
    return prepared


def walk_forward_evaluate(model_name, manifest, split_dir, target_column, feature_columns=None):
    rows = []
    for _, item in manifest.iterrows():
        train = pd.read_csv(split_dir / item["train_file"])
        valid = pd.read_csv(split_dir / item["validation_file"])

        columns, numeric, categorical = model_input_columns(
            train,
            target_column,
            feature_columns=feature_columns,
        )
        X_train = train[columns]
        y_train = train[target_column]
        X_valid = valid[columns]
        y_valid = valid[target_column]

        pipeline = make_model_pipeline(model_name, numeric, categorical)
        pipeline.fit(X_train, y_train)

        train_pred = pipeline.predict(X_train)
        valid_pred = pipeline.predict(X_valid)
        train_m = regression_metrics(y_train, train_pred)
        valid_m = regression_metrics(y_valid, valid_pred)

        rows.append(
            {
                "fold": item["fold"],
                "train_rows": len(train),
                "validation_rows": len(valid),
                "train_MAE": train_m["MAE"],
                "validation_MAE": valid_m["MAE"],
                "train_RMSE": train_m["RMSE"],
                "validation_RMSE": valid_m["RMSE"],
                "train_R2": train_m["R2"],
                "validation_R2": valid_m["R2"],
            }
        )
    return pd.DataFrame(rows)


def aggregate_model_results(fold_results, model_name):
    result = fold_results.copy()
    return {
        "model": model_name,
        "mean_validation_MAE": result["validation_MAE"].mean(),
        "mean_validation_RMSE": result["validation_RMSE"].mean(),
        "mean_validation_R2": result["validation_R2"].mean(),
        "validation_RMSE_std": result["validation_RMSE"].std(ddof=0),
        "mean_train_RMSE": result["train_RMSE"].mean(),
        "RMSE_train_to_validation_gap": result["validation_RMSE"].mean() - result["train_RMSE"].mean(),
    }


def save_json(path: Path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, default=str), encoding="utf-8")
