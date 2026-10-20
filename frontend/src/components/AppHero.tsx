import React from 'react';

export const AppHero: React.FC = () => {
  return (
    <section className="app-page-hero" id="app-page-hero">
      <div className="hero-top-row">
        <div className="hero-identity">
          <div className="hero-breadcrumb">
            <span className="hero-breadcrumb-root">AirIQ</span>
            <span className="hero-breadcrumb-sep">/</span>
            <span className="hero-breadcrumb-node">
              Beijing Telemetry
            </span>
            <span className="hero-breadcrumb-sep">/</span>
            <span className="hero-breadcrumb-current">
              Next-Hour Forecast
            </span>
          </div>

          <h1 className="hero-title">
            Next-Hour PM2.5 Air Quality Forecaster
          </h1>

          <p className="hero-subtitle">
            Live next-hour particulate forecasts from the FastAPI model across
            12 Beijing municipal stations.
          </p>
        </div>

        <div className="hero-kpi-grid">
          <div className="hero-kpi-item">
            <div className="kpi-label">Forecast Horizon</div>
            <div
              className="kpi-val"
              style={{ color: 'var(--accent-cyan-light)' }}
            >
              Next Hour (t + 1)
            </div>
            <div className="kpi-sub">
              On-demand live forecast
            </div>
          </div>

          <div className="hero-kpi-item highlight">
            <div className="kpi-label">Prediction Model</div>
            <div
              className="kpi-val"
              style={{ color: 'var(--accent-emerald)' }}
            >
              Random Forest
            </div>
            <div className="kpi-sub">
              Live-data model service
            </div>
          </div>

          <div className="hero-kpi-item">
            <div className="kpi-label">Model Validation R²</div>
            <div
              className="kpi-val"
              style={{ color: '#60a5fa' }}
            >
              0.923
            </div>
            <div className="kpi-sub">
              Mean validation score
            </div>
          </div>

          <div className="hero-kpi-item">
            <div className="kpi-label">Prediction Source</div>
            <div className="kpi-val">FastAPI</div>
            <div className="kpi-sub">
              Live data and model inference
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};