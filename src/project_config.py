from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = PROJECT_ROOT / "PRSA_Data_20130301-20170228"
RAW_DIR = PROJECT_ROOT / "data" / "raw"
INTERIM_DIR = PROJECT_ROOT / "data" / "interim"
EDA_DIR = PROJECT_ROOT / "data" / "eda"
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"
FEATURE_DIR = PROJECT_ROOT / "data" / "features"
SPLIT_DIR = PROJECT_ROOT / "data" / "splits"
AUDIT_DIR = PROJECT_ROOT / "data" / "audit"
RESULT_DIR = PROJECT_ROOT / "data" / "results"

CANONICAL_RAW = RAW_DIR / "beijing_air_quality.csv"
TARGET_DATA = INTERIM_DIR / "beijing_air_quality_with_target.csv"
CLEAN_STAGE1 = PROCESSED_DIR / "01_after_missing_value_handling.csv"
CLEAN_STAGE2 = PROCESSED_DIR / "02_after_outlier_handling.csv"
ENCODE_STAGE3 = PROCESSED_DIR / "03_after_categorical_encoding.csv"
SCALE_STAGE4 = PROCESSED_DIR / "04_after_scaling_preview.csv"
FEATURE_DATA = FEATURE_DIR / "beijing_air_quality_features.csv"
PHASE8_RESULTS = AUDIT_DIR / "phase8_all_model_results.csv"
PHASE9_COMPARISON = RESULT_DIR / "phase9_model_comparison.csv"
PHASE9_SELECTION = RESULT_DIR / "phase9_selected_model.json"
PHASE10_RESULTS = RESULT_DIR / "phase10_feature_experiments.csv"
PHASE10_SELECTION = RESULT_DIR / "phase10_selected_feature_group.json"
PHASE11_RESULTS = RESULT_DIR / "phase11_tuning_results.csv"
PHASE11_BEST_PARAMS = RESULT_DIR / "phase11_best_parameters.json"
PHASE12_SELECTION = RESULT_DIR / "phase12_final_model_selection.json"

EXPECTED_STATIONS = [
    "Aotizhongxin", "Changping", "Dingling", "Dongsi",
    "Guanyuan", "Gucheng", "Huairou", "Nongzhanguan",
    "Shunyi", "Tiantan", "Wanliu", "Wanshouxigong"
]

WIND_DIRECTIONS = [
    "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"
]

SOURCE_COLUMNS = [
    "No", "year", "month", "day", "hour",
    "PM2.5", "PM10", "SO2", "NO2", "CO", "O3",
    "TEMP", "PRES", "DEWP", "RAIN", "wd", "WSPM", "station"
]
CANONICAL_COLUMNS = SOURCE_COLUMNS + ["datetime"]

POLLUTANTS = ["PM2.5", "PM10", "SO2", "NO2", "CO", "O3"]
WEATHER = ["TEMP", "PRES", "DEWP", "RAIN", "WSPM"]
CONTINUOUS = POLLUTANTS + ["TEMP", "PRES", "DEWP", "WSPM"]
CATEGORICAL = ["wd", "station"]
TEMPORAL = ["year", "month", "day", "hour"]

TARGET = "target_PM25"
TARGET_TIME = "target_datetime"
HAS_NEXT = "has_next_hour"

# Reference chronology for the final untouched holdout.
# Model-development folds are defined below and use target_datetime boundaries.
FINAL_TEST_TARGET_START = "2017-01-01 00:00:00"
FINAL_TEST_TARGET_END = "2017-02-28 23:00:00"
# Backward-compatible audit cutoff used only by Phase 4 snapshots.
# Final modelling preprocessing is NOT fitted from this global snapshot.
TRAIN_TARGET_END = "2015-12-31 23:00:00"
VALID_TARGET_START = "2016-01-01 00:00:00"
VALID_TARGET_END = "2016-12-31 23:00:00"
TEST_TARGET_START = FINAL_TEST_TARGET_START

# Expanding-window walk-forward validation. Each validation period is later
# in time than its training period. The final 2017 Jan-Feb period is never
# used for model selection or tuning.
WALK_FORWARD_FOLDS = [
    {
        "name": "fold_1",
        "train_start": "2013-03-01 00:00:00",
        "train_end": "2013-12-31 23:00:00",
        "validation_start": "2014-01-01 00:00:00",
        "validation_end": "2014-12-31 23:00:00",
    },
    {
        "name": "fold_2",
        "train_start": "2013-03-01 00:00:00",
        "train_end": "2014-12-31 23:00:00",
        "validation_start": "2015-01-01 00:00:00",
        "validation_end": "2015-12-31 23:00:00",
    },
    {
        "name": "fold_3",
        "train_start": "2013-03-01 00:00:00",
        "train_end": "2015-12-31 23:00:00",
        "validation_start": "2016-01-01 00:00:00",
        "validation_end": "2016-12-31 23:00:00",
    },
]

LAGS = [1, 2, 3, 6, 12, 24]
ROLL_MEANS = [3, 6, 24]
ROLL_STDS = [6, 24]

MODEL_NUMERIC = (
    CONTINUOUS
    + ["year", "month", "day", "hour", "day_of_week", "is_weekend", "hour_sin", "hour_cos"]
    + [f"PM2.5_lag_{x}h" for x in LAGS]
    + [f"PM2.5_roll_mean_{x}h" for x in ROLL_MEANS]
    + [f"PM2.5_roll_std_{x}h" for x in ROLL_STDS]
)
