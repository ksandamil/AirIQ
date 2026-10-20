export interface AtmosphericState {
  station: string;
}

export interface AirQuality {
  PM2_5: number;
  PM10: number;
  SO2: number;
  NO2: number;
  CO: number;
  O3: number;
}

export interface Weather {
  TEMP: number;
  PRES: number;
  DEWP: number;
  RAIN: number;
  WSPM: number;
  wd: string;
}

export interface HistoricalFeatures {
  PM2_5_lag_1h: number;
  PM2_5_lag_2h: number;
  PM2_5_lag_3h: number;
  PM2_5_lag_6h: number;
  PM2_5_lag_12h: number;
  PM2_5_lag_24h: number;
  PM2_5_roll_mean_3h: number;
  PM2_5_roll_mean_6h: number;
  PM2_5_roll_mean_24h: number;
  PM2_5_roll_std_6h: number;
  PM2_5_roll_std_24h: number;
}

export interface PredictionResult {
  station: string;
  current_time: string;
  predicted_time: string;
  predicted_pm25: number;
  unit: string;
  air_quality: AirQuality;
  weather: Weather;
  historical_features: HistoricalFeatures;
}

export interface StationInfo {
  id: string;
  name: string;
  type: string;
  district: string;
  lat: number;
  lon: number;
  avg_pm25: number;
  desc: string;
}

export interface ScenarioPreset {
  id: string;
  title: string;
  tag: string;
  state: Record<string, string | number>;
  desc: string;
}
