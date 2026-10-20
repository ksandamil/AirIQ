from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.config.station_coordinates import STATIONS
from backend.services.predictor import predict_next_hour_pm25


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="Beijing PM2.5 Prediction API",
    description="Next-hour PM2.5 prediction using live air-quality and weather data.",
    version="1.0.0"
)


# ============================================================
# CORS CONFIGURATION
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# REQUEST MODEL
# ============================================================

class PredictionRequest(BaseModel):
    station: str


# ============================================================
# AIR QUALITY RESPONSE
# ============================================================

class AirQualityResponse(BaseModel):
    PM2_5: float
    PM10: float
    SO2: float
    NO2: float
    CO: float
    O3: float


# ============================================================
# WEATHER RESPONSE
# ============================================================

class WeatherResponse(BaseModel):
    TEMP: float
    PRES: float
    DEWP: float
    RAIN: float
    WSPM: float
    wd: str


# ============================================================
# HISTORICAL FEATURE RESPONSE
# ============================================================

class HistoricalFeaturesResponse(BaseModel):
    PM2_5_lag_1h: float
    PM2_5_lag_2h: float
    PM2_5_lag_3h: float
    PM2_5_lag_6h: float
    PM2_5_lag_12h: float
    PM2_5_lag_24h: float

    PM2_5_roll_mean_3h: float
    PM2_5_roll_mean_6h: float
    PM2_5_roll_mean_24h: float

    PM2_5_roll_std_6h: float
    PM2_5_roll_std_24h: float


# ============================================================
# COMPLETE PREDICTION RESPONSE
# ============================================================

class PredictionResponse(BaseModel):
    station: str
    current_time: str
    predicted_time: str
    predicted_pm25: float
    unit: str

    air_quality: AirQualityResponse
    weather: WeatherResponse
    historical_features: HistoricalFeaturesResponse


# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "Beijing PM2.5 Prediction API is running",
        "version": "1.0.0"
    }


# ============================================================
# STATIONS ENDPOINT
# ============================================================

@app.get("/stations")
def get_stations():
    return {
        "stations": list(STATIONS.keys())
    }


# ============================================================
# PREDICTION ENDPOINT
# ============================================================

@app.post(
    "/predict",
    response_model=PredictionResponse
)
def predict(request: PredictionRequest):

    # Remove unnecessary spaces
    station = request.station.strip()

    # Check empty station input
    if not station:
        raise HTTPException(
            status_code=400,
            detail="Station name cannot be empty."
        )

    # Check whether the station exists
    if station not in STATIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown station: {station}"
        )

    # Generate prediction
    try:

        result = predict_next_hour_pm25(station)

        # Add measurement unit
        result["unit"] = "µg/m³"

        return result

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(error)}"
        )