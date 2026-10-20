import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          <p style={{ color: '#cbd5e1' }}>
            <strong>AirIQ Platform</strong> &mdash; Beijing Municipal Air Quality Intelligence &amp; Next-Hour Forecaster
          </p>
          <p style={{ fontSize: '0.78rem', marginTop: '0.25rem', color: '#64748b' }}>
            12 Environmental Telemetry Stations &bull; On-demand live forecasts
          </p>
        </div>

        <div className="footer-badges">
          <span className="footer-chip">React 19 &bull; TypeScript</span>
          <span className="footer-chip">Vite 8 Engine</span>
          <span className="footer-chip">FastAPI Inference</span>
        </div>
      </div>
    </footer>
  );
};
