import requests
import pandas as pd
import numpy as np

from backend.config.station_coordinates import STATIONS


# ============================================================
# SETTINGS
# ============================================================

PAST_HOURS = 30


# ============================================================
# SEASON FUNCTION
# ============================================================

def get_season(month):

    if month in [3, 4, 5]:
        return "spring"

    if month in [6, 7, 8]:
        return "summer"

    if month in [9, 10, 11]:
        return "autumn"

    return "winter"


# ============================================================
# WIND DIRECTION FUNCTION
# ============================================================

def degrees_to_wind_direction(degrees):

    if pd.isna(degrees):
        return np.nan

    directions = [
        "N",
        "NE",
        "E",
        "SE",
        "S",
        "SW",
        "W",
        "NW"
    ]

    index = int((degrees + 22.5) // 45) % 8

    return directions[index]


# ============================================================
# GET LIVE FEATURES
# ============================================================

def get_live_features(station):

    latitude = STATIONS[station]["latitude"]
    longitude = STATIONS[station]["longitude"]


    # ========================================================
    # 1. GET AIR QUALITY DATA
    # ========================================================

    air_url = "https://air-quality-api.open-meteo.com/v1/air-quality"

    air_params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": ",".join([
            "pm2_5",
            "pm10",
            "carbon_monoxide",
            "nitrogen_dioxide",
            "sulphur_dioxide",
            "ozone"
        ]),
        "past_hours": PAST_HOURS,
        "forecast_hours": 1,
        "timezone": "Asia/Shanghai"
    }

    air_response = requests.get(
        air_url,
        params=air_params,
        timeout=30
    )

    air_response.raise_for_status()

    air_data = air_response.json()

    air_df = pd.DataFrame(
        air_data["hourly"]
    )

    air_df = air_df.rename(columns={
        "pm2_5": "PM2.5",
        "pm10": "PM10",
        "carbon_monoxide": "CO",
        "nitrogen_dioxide": "NO2",
        "sulphur_dioxide": "SO2",
        "ozone": "O3"
    })


    # ========================================================
    # 2. GET WEATHER DATA
    # ========================================================

    weather_url = "https://api.open-meteo.com/v1/forecast"

    weather_params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": ",".join([
            "temperature_2m",
            "surface_pressure",
            "dew_point_2m",
            "rain",
            "wind_speed_10m",
            "wind_direction_10m"
        ]),
        "past_hours": PAST_HOURS,
        "forecast_hours": 1,
        "timezone": "Asia/Shanghai"
    }

    weather_response = requests.get(
        weather_url,
        params=weather_params,
        timeout=30
    )

    weather_response.raise_for_status()

    weather_data = weather_response.json()

    weather_df = pd.DataFrame(
        weather_data["hourly"]
    )

    weather_df = weather_df.rename(columns={
        "temperature_2m": "TEMP",
        "surface_pressure": "PRES",
        "dew_point_2m": "DEWP",
        "rain": "RAIN",
        "wind_speed_10m": "WSPM",
        "wind_direction_10m": "wind_direction"
    })


    # ========================================================
    # 3. CONVERT TIME
    # ========================================================

    air_df["datetime"] = pd.to_datetime(
        air_df["time"]
    )

    weather_df["datetime"] = pd.to_datetime(
        weather_df["time"]
    )

    air_df = air_df.drop(
        columns=["time"]
    )

    weather_df = weather_df.drop(
        columns=["time"]
    )


    # ========================================================
    # 4. MERGE AIR QUALITY + WEATHER
    # ========================================================

    df = pd.merge(
        air_df,
        weather_df,
        on="datetime",
        how="inner"
    )

    df["station"] = station


    # ========================================================
    # 5. CONVERT WIND DIRECTION
    # ========================================================

    df["wd"] = df["wind_direction"].apply(
        degrees_to_wind_direction
    )

    df = df.drop(
        columns=["wind_direction"]
    )


    # ========================================================
    # 6. CREATE TEMPORAL FEATURES
    # ========================================================

    df["year"] = df["datetime"].dt.year
    df["month"] = df["datetime"].dt.month
    df["day"] = df["datetime"].dt.day
    df["hour"] = df["datetime"].dt.hour

    df["day_of_week"] = (
        df["datetime"].dt.dayofweek
    )

    df["is_weekend"] = (
        df["day_of_week"] >= 5
    ).astype(int)

    df["season"] = df["month"].apply(
        get_season
    )

    df["hour_sin"] = np.sin(
        2 * np.pi * df["hour"] / 24
    )

    df["hour_cos"] = np.cos(
        2 * np.pi * df["hour"] / 24
    )


    # ========================================================
    # 7. CREATE PM2.5 LAG FEATURES
    # ========================================================

    for lag in [1, 2, 3, 6, 12, 24]:

        df[f"PM2.5_lag_{lag}h"] = (
            df["PM2.5"].shift(lag)
        )


    # ========================================================
    # 8. CREATE ROLLING FEATURES
    # ========================================================

    df["PM2.5_roll_mean_3h"] = (
        df["PM2.5"]
        .shift(1)
        .rolling(window=3)
        .mean()
    )

    df["PM2.5_roll_mean_6h"] = (
        df["PM2.5"]
        .shift(1)
        .rolling(window=6)
        .mean()
    )

    df["PM2.5_roll_mean_24h"] = (
        df["PM2.5"]
        .shift(1)
        .rolling(window=24)
        .mean()
    )

    df["PM2.5_roll_std_6h"] = (
        df["PM2.5"]
        .shift(1)
        .rolling(window=6)
        .std()
    )

    df["PM2.5_roll_std_24h"] = (
        df["PM2.5"]
        .shift(1)
        .rolling(window=24)
        .std()
    )


    # ========================================================
    # 9. RETURN DATASET
    # ========================================================

    return df


# ============================================================
# TEST THE FUNCTION
# ============================================================

if __name__ == "__main__":

    STATION = "Aotizhongxin"

    df = get_live_features(STATION)

    print("\n======================================")
    print("LIVE DATASET CREATED")
    print("======================================")

    print("Station:", STATION)
    print("Rows:", len(df))

    print("\nColumns:")
    print(df.columns.tolist())

    print("\nLast available hour:")

    print(
        df[
            [
                "datetime",
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
                "wd"
            ]
        ]
        .tail(1)
        .to_string(index=False)
    )

    print("\n======================================")
    print("LATEST MODEL INPUT FEATURES")
    print("======================================")

    latest = df.iloc[-2]

    print(latest.to_string())