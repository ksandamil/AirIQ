import { useState, type CSSProperties } from 'react';
import type { PredictionResult } from '../types';

const WIND_DIRECTION_LABELS: Record<string, string> = {
  N: 'North',
  NNE: 'North-northeast',
  NE: 'Northeast',
  ENE: 'East-northeast',
  E: 'East',
  ESE: 'East-southeast',
  SE: 'Southeast',
  SSE: 'South-southeast',
  S: 'South',
  SSW: 'South-southwest',
  SW: 'Southwest',
  WSW: 'West-southwest',
  W: 'West',
  WNW: 'West-northwest',
  NW: 'Northwest',
  NNW: 'North-northwest'
};

const WIND_DIRECTION_ARROWS: Record<string, string> = {
  N: '↑',
  NE: '↗',
  E: '→',
  SE: '↘',
  S: '↓',
  SW: '↙',
  W: '←',
  NW: '↖'
};

const WIND_DIRECTION_DEGREES: Record<string, number> = {
  N: 0,
  NE: 45,
  E: 90,
  SE: 135,
  S: 180,
  SW: 225,
  W: 270,
  NW: 315
};

function getTrendLabel(delta: number): string {
  if (delta <= -10) return 'Rapidly Improving';
  if (delta <= -3) return 'Improving';
  if (delta < 3) return 'Stable';
  if (delta < 10) return 'Increasing';
  return 'Rapidly Increasing';
}

function getAirQualityOutlook(pm25: number): { label: string; color: string } {
  if (pm25 <= 12) return { label: 'Good', color: '#10b981' };
  if (pm25 <= 35) return { label: 'Moderate', color: '#f59e0b' };
  if (pm25 <= 55) return { label: 'Poor', color: '#f97316' };
  return { label: 'Very Poor', color: '#ef4444' };
}

function getRecentHistoryTrend(lag1h: number, lag3h: number): string {
  if (lag1h > lag3h) return 'Increasing';
  if (lag1h < lag3h) return 'Declining';
  return 'Stable';
}

function getVariabilityLabel(rollStd24h: number): string {
  if (rollStd24h < 5) return 'Low';
  if (rollStd24h <= 10) return 'Moderate';
  return 'High';
}

const COMPASS_LABEL_POSITIONS: Record<string, CSSProperties> = {
  N: { top: '4px', left: '50%', transform: 'translateX(-50%)', color: '#f43f5e' },
  NE: { top: '17px', right: '14px' },
  E: { top: '50%', right: '4px', transform: 'translateY(-50%)' },
  SE: { bottom: '17px', right: '14px' },
  S: { bottom: '4px', left: '50%', transform: 'translateX(-50%)' },
  SW: { bottom: '17px', left: '14px' },
  W: { top: '50%', left: '4px', transform: 'translateY(-50%)' },
  NW: { top: '17px', left: '14px' }
};

interface ReadOnlyMeterProps {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  highlighted?: boolean;
}

function ReadOnlyMeter({ label, value, unit, min, max, highlighted = false }: ReadOnlyMeterProps) {
  const meterValue = Math.min(max, Math.max(min, value));

  return (
    <div className={highlighted ? 'hero-slider-box' : 'slider-group'}>
      <div className="slider-header">
        {highlighted ? (
          <div className="slider-title-area">
            <span className="form-label highlight-label">{label}</span>
            <span className="slider-desc">Live backend data · Read-only</span>
          </div>
        ) : (
          <span className="form-label">{label}</span>
        )}
        <span className="slider-val-box">{value} {unit}</span>
      </div>
      <input
        type="range"
        className={`custom-range${highlighted ? ' custom-range-hero' : ''}`}
        min={min}
        max={max}
        value={meterValue}
        disabled
        tabIndex={-1}
        aria-label={`${label}: ${value} ${unit}`}
      />
    </div>
  );
}

interface ForecasterTabProps {
  station: string;
  onStationChange: (station: string) => void;
  prediction: PredictionResult | null;
  stations: string[];
  isLoading: boolean;
  error: string | null;
  onPredict: () => void;
}

export function ForecasterTab({
  station,
  onStationChange,
  prediction,
  stations,
  isLoading,
  error,
  onPredict
}: ForecasterTabProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  const handleCopySummary = async () => {
    if (!prediction) return;
    setCopyError(null);

    const summary = [
      `Station: ${prediction.station}`,
      `Predicted PM2.5: ${prediction.predicted_pm25} ${prediction.unit}`,
      `Current observation: ${prediction.current_time}`,
      `Forecast: ${prediction.predicted_time}`
    ].join('\n');

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
      setCopyError('Unable to copy the forecast summary to the clipboard.');
    }
  };

  const pm25Delta = prediction
    ? prediction.predicted_pm25 - prediction.air_quality.PM2_5
    : null;
  const trendLabel = pm25Delta === null ? null : getTrendLabel(pm25Delta);
  const airQualityOutlook = prediction
    ? getAirQualityOutlook(prediction.predicted_pm25)
    : null;
  const outlookMarkerPosition = prediction
    ? `${Math.min(Math.max(prediction.predicted_pm25 / 75, 0), 1) * 100}%`
    : '0%';

  return (
    <div className="forecaster-grid">
      <div className="glass-panel" id="telemetry-panel">
        <div className="section-header">
          <div>
            <h2 className="section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M2 12h20" />
                <circle cx="12" cy="12" r="7" />
              </svg>
              Advanced Atmospheric Dashboard
            </h2>
            <p className="section-subtitle">
              Read-only live conditions and model features returned by the prediction backend.
            </p>
          </div>
        </div>

        <form onSubmit={(event) => { event.preventDefault(); onPredict(); }}>
          <fieldset className="form-fieldset">
            <div className="fieldset-header">
              <legend className="fieldset-title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                1. Monitoring Station & Live Observation
              </legend>
              <span className="station-type-tag">LIVE BACKEND DATA</span>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="input-station">Beijing monitoring station</label>
                <select
                  className="form-control station-select"
                  id="input-station"
                  value={station}
                  onChange={(event) => onStationChange(event.target.value)}
                  disabled={isLoading || stations.length === 0}
                >
                  {stations.map((stationName) => (
                    <option key={stationName} value={stationName}>{stationName}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <span className="form-label">Current observation time</span>
                <div className="form-control" aria-live="polite">
                  {prediction?.current_time || (isLoading ? 'Fetching live data...' : 'Awaiting forecast')}
                </div>
              </div>
            </div>
          </fieldset>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading || stations.length === 0}
          >
            {isLoading ? 'Fetching live data...' : 'Generate Next-Hour Forecast'}
          </button>

          {error && (
            <div className="info-callout" role="alert" style={{ marginTop: '1rem' }}>
              <p>{error}</p>
            </div>
          )}
          {copyError && (
            <div className="info-callout" role="alert" style={{ marginTop: '1rem' }}>
              <p>{copyError}</p>
            </div>
          )}
        </form>

        {prediction && (
          <>
            <fieldset className="form-fieldset">
              <div className="fieldset-header">
                <legend className="fieldset-title">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  2. Air Quality / Pollutant Concentrations
                </legend>
                <span className="info-pill-hint">Live backend data · Read-only</span>
              </div>

              <div style={{ marginTop: '0.75rem' }}>
                <ReadOnlyMeter
                  label="PM2.5 Concentration"
                  value={prediction.air_quality.PM2_5}
                  unit="µg/m³"
                  min={0}
                  max={600}
                  highlighted
                />
              </div>

              <div className="form-row">
                <ReadOnlyMeter label="PM10" value={prediction.air_quality.PM10} unit="µg/m³" min={0} max={800} />
                <ReadOnlyMeter label="SO2" value={prediction.air_quality.SO2} unit="µg/m³" min={0} max={300} />
                <ReadOnlyMeter label="NO2" value={prediction.air_quality.NO2} unit="µg/m³" min={0} max={250} />
                <ReadOnlyMeter label="CO" value={prediction.air_quality.CO} unit="µg/m³" min={0} max={10000} />
                <ReadOnlyMeter label="O3" value={prediction.air_quality.O3} unit="µg/m³" min={0} max={400} />
              </div>
            </fieldset>

            <fieldset className="form-fieldset">
              <div className="fieldset-header">
                <legend className="fieldset-title">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                  </svg>
                  3. Meteorology & Ventilation Dynamics
                </legend>
                <span className="info-pill-hint">Live backend data · Read-only</span>
              </div>

              <div className="form-row">
                <ReadOnlyMeter label="Temperature (TEMP)" value={prediction.weather.TEMP} unit="°C" min={-20} max={42} />
                <ReadOnlyMeter label="Pressure (PRES)" value={prediction.weather.PRES} unit="hPa" min={980} max={1045} />
                <ReadOnlyMeter label="Dew Point (DEWP)" value={prediction.weather.DEWP} unit="°C" min={-30} max={30} />
                <ReadOnlyMeter label="Rain" value={prediction.weather.RAIN} unit="mm" min={0} max={50} />
              </div>

              <div className="wind-compass-section" style={{ marginTop: '1rem' }}>
                <div className="compass-container">
                  <div className="compass-rose" aria-label="Wind direction compass">
                    {Object.keys(COMPASS_LABEL_POSITIONS).map((direction) => (
                      <span
                        key={direction}
                        className="compass-label"
                        style={COMPASS_LABEL_POSITIONS[direction]}
                      >
                        {direction}
                      </span>
                    ))}
                    {WIND_DIRECTION_DEGREES[prediction.weather.wd] !== undefined && (
                      <div
                        className="compass-needle"
                        style={{ transform: `rotate(${WIND_DIRECTION_DEGREES[prediction.weather.wd]}deg)` }}
                        aria-hidden="true"
                      />
                    )}
                    <div className="compass-center-cap" />
                  </div>

                  <div className="compass-meta-column">
                    <div className="wind-dir-header">
                      <span>Direction:</span>
                      <strong className="wind-current-dir">
                        {WIND_DIRECTION_ARROWS[prediction.weather.wd] || ''}
                        {' '}
                        {WIND_DIRECTION_LABELS[prediction.weather.wd] || prediction.weather.wd}
                      </strong>
                    </div>
                    <div className="slider-group" style={{ marginTop: '0.65rem' }}>
                      <div className="slider-header">
                        <span className="form-label">Wind Velocity (WSPM)</span>
                        <span className="slider-val-box">{prediction.weather.WSPM} m/s</span>
                      </div>
                      <input
                        type="range"
                        className="custom-range"
                        min={0}
                        max={14}
                        value={Math.min(14, Math.max(0, prediction.weather.WSPM))}
                        disabled
                        tabIndex={-1}
                        aria-label={`Wind speed: ${prediction.weather.WSPM} m/s`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </fieldset>

            <fieldset className="form-fieldset">
              <div className="fieldset-header">
                <legend className="fieldset-title">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 14 14" />
                  </svg>
                  4. PM2.5 Temporal Buffer
                </legend>
                <span className="info-pill-hint">Model historical features · Read-only</span>
              </div>

              <div className="form-row">
                <ReadOnlyMeter label="PM2.5 Lag · 1h" value={prediction.historical_features.PM2_5_lag_1h} unit="µg/m³" min={0} max={600} />
                <ReadOnlyMeter label="PM2.5 Lag · 2h" value={prediction.historical_features.PM2_5_lag_2h} unit="µg/m³" min={0} max={600} />
                <ReadOnlyMeter label="PM2.5 Lag · 3h" value={prediction.historical_features.PM2_5_lag_3h} unit="µg/m³" min={0} max={600} />
                <ReadOnlyMeter label="PM2.5 Lag · 6h" value={prediction.historical_features.PM2_5_lag_6h} unit="µg/m³" min={0} max={600} />
                <ReadOnlyMeter label="PM2.5 Lag · 12h" value={prediction.historical_features.PM2_5_lag_12h} unit="µg/m³" min={0} max={600} />
                <ReadOnlyMeter label="PM2.5 Lag · 24h" value={prediction.historical_features.PM2_5_lag_24h} unit="µg/m³" min={0} max={600} />
              </div>
            </fieldset>

            <fieldset className="form-fieldset">
              <div className="fieldset-header">
                <legend className="fieldset-title">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3v18h18M7 14l4-4 4 4 6-7" />
                  </svg>
                  5. Rolling Telemetry
                </legend>
                <span className="info-pill-hint">Model features · Read-only</span>
              </div>

              <div className="form-row">
                <ReadOnlyMeter label="3h Rolling Mean" value={prediction.historical_features.PM2_5_roll_mean_3h} unit="µg/m³" min={0} max={600} />
                <ReadOnlyMeter label="6h Rolling Mean" value={prediction.historical_features.PM2_5_roll_mean_6h} unit="µg/m³" min={0} max={600} />
                <ReadOnlyMeter label="24h Rolling Mean" value={prediction.historical_features.PM2_5_roll_mean_24h} unit="µg/m³" min={0} max={600} />
                <ReadOnlyMeter label="6h Rolling Std. Dev." value={prediction.historical_features.PM2_5_roll_std_6h} unit="µg/m³" min={0} max={100} />
                <ReadOnlyMeter label="24h Rolling Std. Dev." value={prediction.historical_features.PM2_5_roll_std_24h} unit="µg/m³" min={0} max={100} />
              </div>
            </fieldset>
          </>
        )}
      </div>

      <div className="prediction-column">
        <div className="prediction-card">
          <div className="pred-card-topbar">
            <div className="pred-horizon-label">
              <span className="pulse-dot" style={{ backgroundColor: '#38bdf8' }}></span>
              Next-Hour Forecast
            </div>

            <div className="pred-actions">
              <button
                type="button"
                className="action-btn"
                onClick={handleCopySummary}
                title="Copy backend forecast summary to clipboard"
                disabled={!prediction}
              >
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {prediction || isLoading ? (
            <div className="pred-hero-metric" aria-live="polite">
              {isLoading ? (
                <div className="pred-trend-text">Fetching live data...</div>
              ) : (
                <>
                  <div className="pred-large-num">
                    {prediction ? prediction.predicted_pm25 : '--'}
                  </div>
                  <span className="pred-unit">{prediction?.unit || 'µg/m³'}</span>
                </>
              )}
            </div>
          ) : (
            <div className="forecast-empty-state" aria-live="polite">
              <div className="forecast-empty-icon" aria-hidden="true">
                <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 16.2A4.5 4.5 0 0 0 18.5 7.5a6.5 6.5 0 0 0-12.3 1.8A3.8 3.8 0 0 0 6.8 17H19" />
                  <path d="M8 20h.01M12 20h.01M16 20h.01" />
                </svg>
              </div>
              <h3>Ready for your forecast</h3>
              <p>Select a Beijing monitoring station and generate a live next-hour PM2.5 prediction.</p>
              <div className="forecast-status-indicators" aria-label="Forecast details">
                <span><i aria-hidden="true" />Live API Data</span>
                <span><i aria-hidden="true" />Random Forest</span>
                <span><i aria-hidden="true" />+1 Hour Forecast</span>
              </div>
            </div>
          )}

          {prediction && pm25Delta !== null && trendLabel && airQualityOutlook && (
            <>
              <div className="pred-trend-row" aria-live="polite">
                <span className={`pred-delta-pill ${pm25Delta > 0 ? 'positive' : pm25Delta < 0 ? 'negative' : ''}`}>
                  {pm25Delta > 0 ? '+' : ''}{pm25Delta.toFixed(2)} µg/m³
                </span>
                <span className="pred-trend-text">{trendLabel}</span>
              </div>

              <div className="aqi-container">
                <div className="aqi-header-row">
                  <span className="aqi-title">Air Quality Outlook</span>
                  <span className="aqi-pill" style={{ backgroundColor: airQualityOutlook.color }}>
                    {airQualityOutlook.label}
                  </span>
                </div>
                <div
                  className="aqi-bar"
                  role="img"
                  aria-label={`Predicted PM2.5 ${prediction.predicted_pm25} µg/m³, ${airQualityOutlook.label}`}
                  style={{ position: 'relative', overflow: 'visible' }}
                >
                  <div className="aqi-segment c1" style={{ flex: '12', backgroundColor: '#10b981' }} />
                  <div className="aqi-segment c2" style={{ flex: '23', backgroundColor: '#f59e0b' }} />
                  <div className="aqi-segment c3" style={{ flex: '20', backgroundColor: '#f97316' }} />
                  <div className="aqi-segment c4" style={{ flex: '20', backgroundColor: '#ef4444' }} />
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      left: outlookMarkerPosition,
                      top: '50%',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      border: '2px solid #fff',
                      backgroundColor: airQualityOutlook.color,
                      boxShadow: `0 0 8px ${airQualityOutlook.color}`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                </div>
                <p className="aqi-advisory">
                  Predicted PM2.5: {prediction.predicted_pm25} {prediction.unit}
                  {' · '}Good ≤12 · Moderate &gt;12–35 · Poor &gt;35–55 · Very Poor &gt;55 µg/m³
                </p>
              </div>
            </>
          )}

          {prediction && (
            <>
              <div className="confidence-box">
                <div className="confidence-header">
                  <span>Backend Prediction</span>
                </div>
                <div className="uncertainty-grid">
                  <div className="interval-card">
                    <div className="interval-label">Station</div>
                    <div className="interval-val">{prediction.station}</div>
                  </div>
                  <div className="interval-card">
                    <div className="interval-label">Current observation</div>
                    <div className="interval-val">{prediction.current_time}</div>
                  </div>
                  <div className="interval-card">
                    <div className="interval-label">Forecast</div>
                    <div className="interval-val">{prediction.predicted_time}</div>
                  </div>
                </div>
              </div>

              <div className="confidence-box">
                <div className="confidence-header">
                  <span>Live Conditions · Current Air Quality</span>
                  <span className="mono" style={{ color: getAirQualityOutlook(prediction.air_quality.PM2_5).color }}>
                    Current condition: {getAirQualityOutlook(prediction.air_quality.PM2_5).label}
                  </span>
                </div>
                <div className="uncertainty-grid">
                  <div className="interval-card">
                    <div className="interval-label">PM2.5</div>
                    <div className="interval-val">{prediction.air_quality.PM2_5}</div>
                  </div>
                  <div className="interval-card">
                    <div className="interval-label">PM10</div>
                    <div className="interval-val">{prediction.air_quality.PM10}</div>
                  </div>
                  <div className="interval-card">
                    <div className="interval-label">SO2</div>
                    <div className="interval-val">{prediction.air_quality.SO2}</div>
                  </div>
                  <div className="interval-card">
                    <div className="interval-label">NO2</div>
                    <div className="interval-val">{prediction.air_quality.NO2}</div>
                  </div>
                  <div className="interval-card">
                    <div className="interval-label">CO</div>
                    <div className="interval-val">{prediction.air_quality.CO}</div>
                  </div>
                  <div className="interval-card">
                    <div className="interval-label">O3</div>
                    <div className="interval-val">{prediction.air_quality.O3}</div>
                  </div>
                </div>
              </div>

              <div className="confidence-box">
                <div className="confidence-header">
                  <span>Live Conditions · Current Weather</span>
                </div>
                <div className="uncertainty-grid">
                  <div className="interval-card">
                    <div className="interval-label">Temperature</div>
                    <div className="interval-val">{prediction.weather.TEMP} °C</div>
                  </div>
                  <div className="interval-card">
                    <div className="interval-label">Pressure</div>
                    <div className="interval-val">{prediction.weather.PRES} hPa</div>
                  </div>
                  <div className="interval-card">
                    <div className="interval-label">Dew Point</div>
                    <div className="interval-val">{prediction.weather.DEWP} °C</div>
                  </div>
                  <div className="interval-card">
                    <div className="interval-label">Rain</div>
                    <div className="interval-val">{prediction.weather.RAIN} mm</div>
                  </div>
                  <div className="interval-card">
                    <div className="interval-label">Wind Speed</div>
                    <div className="interval-val">{prediction.weather.WSPM} m/s</div>
                  </div>
                  <div className="interval-card">
                    <div className="interval-label">Wind Direction</div>
                    <div className="interval-val">
                      {WIND_DIRECTION_LABELS[prediction.weather.wd] || prediction.weather.wd}
                    </div>
                  </div>
                </div>
              </div>

              <div className="confidence-box">
                <div className="confidence-header">
                  <span>Model Historical Features · PM2.5 History</span>
                  <span className="mono" style={{ color: 'var(--accent-cyan-light)' }}>
                    Recent trend: {getRecentHistoryTrend(
                      prediction.historical_features.PM2_5_lag_1h,
                      prediction.historical_features.PM2_5_lag_3h
                    )}
                  </span>
                </div>
                <div className="uncertainty-grid">
                  <div className="interval-card">
                    <div className="interval-label">1h Lag</div>
                    <div className="interval-val">{prediction.historical_features.PM2_5_lag_1h}</div>
                  </div>
                  <div className="interval-card">
                    <div className="interval-label">2h Lag</div>
                    <div className="interval-val">{prediction.historical_features.PM2_5_lag_2h}</div>
                  </div>
                  <div className="interval-card">
                    <div className="interval-label">3h Lag</div>
                    <div className="interval-val">{prediction.historical_features.PM2_5_lag_3h}</div>
                  </div>
                  <div className="interval-card">
                    <div className="interval-label">6h Lag</div>
                    <div className="interval-val">{prediction.historical_features.PM2_5_lag_6h}</div>
                  </div>
                  <div className="interval-card">
                    <div className="interval-label">12h Lag</div>
                    <div className="interval-val">{prediction.historical_features.PM2_5_lag_12h}</div>
                  </div>
                  <div className="interval-card">
                    <div className="interval-label">24h Lag</div>
                    <div className="interval-val">{prediction.historical_features.PM2_5_lag_24h}</div>
                  </div>
                </div>
              </div>

              <div className="confidence-box">
                <div className="confidence-header">
                  <span>Model Historical Features · PM2.5 Rolling Statistics</span>
                  <span className="mono" style={{ color: 'var(--accent-cyan-light)' }}>
                    Variability: {getVariabilityLabel(prediction.historical_features.PM2_5_roll_std_24h)}
                  </span>
                </div>
                <div className="uncertainty-grid">
                  <div className="interval-card">
                    <div className="interval-label">3h Rolling Mean</div>
                    <div className="interval-val">{prediction.historical_features.PM2_5_roll_mean_3h}</div>
                  </div>
                  <div className="interval-card">
                    <div className="interval-label">6h Rolling Mean</div>
                    <div className="interval-val">{prediction.historical_features.PM2_5_roll_mean_6h}</div>
                  </div>
                  <div className="interval-card">
                    <div className="interval-label">24h Rolling Mean</div>
                    <div className="interval-val">{prediction.historical_features.PM2_5_roll_mean_24h}</div>
                  </div>
                  <div className="interval-card">
                    <div className="interval-label">6h Rolling Standard Deviation</div>
                    <div className="interval-val">{prediction.historical_features.PM2_5_roll_std_6h}</div>
                  </div>
                  <div className="interval-card">
                    <div className="interval-label">24h Rolling Standard Deviation</div>
                    <div className="interval-val">{prediction.historical_features.PM2_5_roll_std_24h}</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
