import type { AirQuality, HistoricalFeatures, PredictionResult, Weather } from '../types';

const API_BASE_URL = 'http://127.0.0.1:8000';
const AIR_QUALITY_FIELDS: (keyof AirQuality)[] = ['PM2_5', 'PM10', 'SO2', 'NO2', 'CO', 'O3'];
const WEATHER_FIELDS: (keyof Omit<Weather, 'wd'>)[] = ['TEMP', 'PRES', 'DEWP', 'RAIN', 'WSPM'];
const HISTORICAL_FEATURE_FIELDS: (keyof HistoricalFeatures)[] = [
  'PM2_5_lag_1h',
  'PM2_5_lag_2h',
  'PM2_5_lag_3h',
  'PM2_5_lag_6h',
  'PM2_5_lag_12h',
  'PM2_5_lag_24h',
  'PM2_5_roll_mean_3h',
  'PM2_5_roll_mean_6h',
  'PM2_5_roll_mean_24h',
  'PM2_5_roll_std_6h',
  'PM2_5_roll_std_24h'
];

function isRecord(data: unknown): data is Record<string, unknown> {
  return typeof data === 'object' && data !== null && !Array.isArray(data);
}

function hasNumericFields<K extends string>(
  data: unknown,
  fields: readonly K[]
): data is Record<K, number> {
  return isRecord(data) && fields.every(
    (field) => typeof data[field] === 'number' && Number.isFinite(data[field])
  );
}

function hasAirQuality(data: unknown): data is AirQuality {
  return hasNumericFields(data, AIR_QUALITY_FIELDS);
}

function hasWeather(data: unknown): data is Weather {
  if (!isRecord(data) || typeof data.wd !== 'string') {
    return false;
  }

  return hasNumericFields(data, WEATHER_FIELDS);
}

function hasHistoricalFeatures(data: unknown): data is HistoricalFeatures {
  return hasNumericFields(data, HISTORICAL_FEATURE_FIELDS);
}

function hasStationList(data: unknown): data is { stations: string[] } {
  if (
    typeof data !== 'object' ||
    data === null ||
    !('stations' in data) ||
    !Array.isArray(data.stations) ||
    data.stations.length === 0
  ) {
    return false;
  }

  return data.stations.every((station: unknown) => typeof station === 'string' && station.length > 0);
}

async function getRequestError(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (typeof body === 'object' && body !== null && 'detail' in body) {
      const detail = body.detail;
      if (typeof detail === 'string') {
        return detail;
      }
      return JSON.stringify(detail);
    }
  } catch {
    // The backend may return a non-JSON error body.
  }

  return `Prediction server returned HTTP ${response.status}.`;
}

async function request(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        'Unable to connect to the prediction server. Make sure the backend is running at http://127.0.0.1:8000. ' +
        'If the server is running and this request is blocked by CORS, configure FastAPI CORSMiddleware to allow ' +
        'origins ["http://localhost:5173", "http://127.0.0.1:5173"], methods ["*"], and headers ["*"].'
      );
    }
    throw error;
  }
}

export async function fetchStations(): Promise<string[]> {
  const response = await request(`${API_BASE_URL}/stations`);
  if (!response.ok) {
    throw new Error(await getRequestError(response));
  }

  const data: unknown = await response.json();
  if (!hasStationList(data)) {
    throw new Error('The prediction server returned an invalid station list.');
  }

  return data.stations;
}

export async function predictNextHour(station: string, signal?: AbortSignal): Promise<PredictionResult> {
  const response = await request(`${API_BASE_URL}/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ station }),
    signal
  });

  if (!response.ok) {
    throw new Error(await getRequestError(response));
  }

  const data: unknown = await response.json();
  if (
    !isRecord(data) ||
    typeof data.station !== 'string' ||
    typeof data.current_time !== 'string' ||
    typeof data.predicted_time !== 'string' ||
    typeof data.predicted_pm25 !== 'number' ||
    !Number.isFinite(data.predicted_pm25) ||
    typeof data.unit !== 'string' ||
    !hasAirQuality(data.air_quality) ||
    !hasWeather(data.weather) ||
    !hasHistoricalFeatures(data.historical_features)
  ) {
    throw new Error('The prediction server returned an invalid prediction response.');
  }

  return {
    station: data.station,
    current_time: data.current_time,
    predicted_time: data.predicted_time,
    predicted_pm25: data.predicted_pm25,
    unit: data.unit,
    air_quality: data.air_quality,
    weather: data.weather,
    historical_features: data.historical_features
  };
}
