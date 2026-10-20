import joblib
import pandas as pd
from pathlib import Path

from backend.services.live_features import get_live_features


# ============================================================
# MODEL PATH
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[1]

MODEL_PATH = (
    BASE_DIR
    / "model"
    / "final_pm25_pipeline.joblib"
)


# ============================================================
# LOAD MODEL
# ============================================================

model = joblib.load(MODEL_PATH)


# ============================================================
# MODEL FEATURES
# ============================================================

FEATURE_COLUMNS = [
    "year",
    "month",
    "day",
    "hour",
    "PM2.5",
    "PM10",
    "SO2",
    "NO2",
    "CO",
    "O3",
    "TEMP",
    "PRES",
    "DEWP",
    "RAIN",
    "WSPM",
    "wd",
    "station",
    "day_of_week",
    "is_weekend",
    "season",
    "hour_sin",
    "hour_cos",
    "PM2.5_lag_1h",
    "PM2.5_lag_2h",
    "PM2.5_lag_3h",
    "PM2.5_lag_6h",
    "PM2.5_lag_12h",
    "PM2.5_lag_24h",
    "PM2.5_roll_mean_3h",
    "PM2.5_roll_mean_6h",
    "PM2.5_roll_mean_24h",
    "PM2.5_roll_std_6h",
    "PM2.5_roll_std_24h"
]


# ============================================================
# PREDICTION FUNCTION
# ============================================================

def predict_next_hour_pm25(station):

    # --------------------------------------------------------
    # 1. Get live data and engineered features
    # --------------------------------------------------------

    df = get_live_features(station)

    # Make sure data is ordered by time
    df = df.sort_values("datetime").reset_index(drop=True)

    # --------------------------------------------------------
    # 2. Select the latest available hourly observation
    # --------------------------------------------------------

    # The last row is the forecast hour.
    # Therefore, select the latest completed hourly observation.
    latest = df.iloc[-2]

    # --------------------------------------------------------
    # 3. Select only the features required by the model
    # --------------------------------------------------------

    X_live = pd.DataFrame(
        [latest]
    )[FEATURE_COLUMNS]

    # --------------------------------------------------------
    # 4. Generate prediction
    # --------------------------------------------------------

    prediction = model.predict(X_live)[0]

    # --------------------------------------------------------
    # 5. Define current and predicted timestamps
    # --------------------------------------------------------

    current_time = latest["datetime"]

    predicted_time = (
        current_time + pd.Timedelta(hours=1)
    )

    # --------------------------------------------------------
    # 6. Return prediction + live atmospheric conditions
    # --------------------------------------------------------

    return {

        # Prediction information
        "station": station,
        "current_time": str(current_time),
        "predicted_time": str(predicted_time),
        "predicted_pm25": round(
            float(prediction),
            2
        ),

        # Current air-quality conditions
        "air_quality": {
            "PM2_5": round(float(latest["PM2.5"]), 2),
            "PM10": round(float(latest["PM10"]), 2),
            "SO2": round(float(latest["SO2"]), 2),
            "NO2": round(float(latest["NO2"]), 2),
            "CO": round(float(latest["CO"]), 2),
            "O3": round(float(latest["O3"]), 2)
        },

        # Current weather conditions
        "weather": {
            "TEMP": round(float(latest["TEMP"]), 2),
            "PRES": round(float(latest["PRES"]), 2),
            "DEWP": round(float(latest["DEWP"]), 2),
            "RAIN": round(float(latest["RAIN"]), 2),
            "WSPM": round(float(latest["WSPM"]), 2),
            "wd": str(latest["wd"])
        },

        # Historical PM2.5 features used by the model
        "historical_features": {
            "PM2_5_lag_1h": round(
                float(latest["PM2.5_lag_1h"]),
                2
            ),
            "PM2_5_lag_2h": round(
                float(latest["PM2.5_lag_2h"]),
                2
            ),
            "PM2_5_lag_3h": round(
                float(latest["PM2.5_lag_3h"]),
                2
            ),
            "PM2_5_lag_6h": round(
                float(latest["PM2.5_lag_6h"]),
                2
            ),
            "PM2_5_lag_12h": round(
                float(latest["PM2.5_lag_12h"]),
                2
            ),
            "PM2_5_lag_24h": round(
                float(latest["PM2.5_lag_24h"]),
                2
            ),
            "PM2_5_roll_mean_3h": round(
                float(latest["PM2.5_roll_mean_3h"]),
                2
            ),
            "PM2_5_roll_mean_6h": round(
                float(latest["PM2.5_roll_mean_6h"]),
                2
            ),
            "PM2_5_roll_mean_24h": round(
                float(latest["PM2.5_roll_mean_24h"]),
                2
            ),
            "PM2_5_roll_std_6h": round(
                float(latest["PM2.5_roll_std_6h"]),
                2
            ),
            "PM2_5_roll_std_24h": round(
                float(latest["PM2.5_roll_std_24h"]),
                2
            )
        }
    }