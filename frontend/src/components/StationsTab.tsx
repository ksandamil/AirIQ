import React, { useState, useMemo } from 'react';
import { STATIONS_DATA } from '../data/stationsData';
import type { StationInfo } from '../types';

interface StationsTabProps {
  onSelectStationForForecast: (stationId: string) => void;
  stationIds: string[];
}

export const StationsTab: React.FC<StationsTabProps> = ({
  onSelectStationForForecast,
  stationIds
}) => {
  const [selectedStationId, setSelectedStationId] = useState<string>(STATIONS_DATA[0].id);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hoveredStation, setHoveredStation] = useState<StationInfo | null>(null);
  const availableStations = useMemo(
    () => STATIONS_DATA.filter((station) => stationIds.includes(station.id)),
    [stationIds]
  );
  const selectedStation = availableStations.find((station) => station.id === selectedStationId)
    || availableStations[0]
    || STATIONS_DATA[0];

  // Filter stations based on search and category
  const filteredStations = useMemo(() => {
    return availableStations.filter((st) => {
      // Category filter
      if (filterCategory === 'urban' && !st.type.toLowerCase().includes('urban')) return false;
      if (filterCategory === 'suburban' && !st.type.toLowerCase().includes('suburb')) return false;
      if (filterCategory === 'background' && !st.type.toLowerCase().includes('background') && !st.type.toLowerCase().includes('ecological')) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = st.name.toLowerCase().includes(q);
        const matchesId = st.id.toLowerCase().includes(q);
        const matchesDistrict = st.district.toLowerCase().includes(q);
        const matchesType = st.type.toLowerCase().includes(q);
        return matchesName || matchesId || matchesDistrict || matchesType;
      }

      return true;
    });
  }, [availableStations, filterCategory, searchQuery]);

  // Convert GPS (lat: ~39.7 to 40.35, lon: ~116.1 to 116.7) to SVG viewbox (800x600)
  const getCoordinates = (lat: number, lon: number) => {
    const minLat = 39.70;
    const maxLat = 40.38;
    const minLon = 116.10;
    const maxLon = 116.72;

    const x = ((lon - minLon) / (maxLon - minLon)) * 720 + 40;
    const y = (1 - (lat - minLat) / (maxLat - minLat)) * 520 + 40;
    return { x, y };
  };

  const getPm25BadgeColor = (val: number) => {
    if (val <= 70) return '#10b981'; // emerald
    if (val <= 80) return '#06b6d4'; // cyan
    if (val <= 85) return '#f59e0b'; // amber
    return '#f43f5e'; // rose
  };

  return (
    <div className="glass-panel" id="stations-network-panel">
      {/* Header and Controls */}
      <div className="section-header">
        <div>
          <div className="badge-row">
            <span className="clean-badge">Spatial Telemetry Grid</span>
            <span className="badge-dim">12 Municipal Sensors</span>
          </div>
          <h2 className="section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Beijing Monitoring Stations Network
          </h2>
          <p className="section-subtitle">
            Explore geographical distribution, local environmental topography, and historical particulate baselines across Beijing municipality.
          </p>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="station-toolbar">
          <div className="search-box-wrapper">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              type="text"
              placeholder="Search station or district..."
              className="station-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
              >
                &times;
              </button>
            )}
          </div>

          <div className="category-filter-strip">
            <button
              type="button"
              className={`cat-pill ${filterCategory === 'all' ? 'active' : ''}`}
              onClick={() => setFilterCategory('all')}
            >
              All (12)
            </button>
            <button
              type="button"
              className={`cat-pill ${filterCategory === 'urban' ? 'active' : ''}`}
              onClick={() => setFilterCategory('urban')}
            >
              Urban (6)
            </button>
            <button
              type="button"
              className={`cat-pill ${filterCategory === 'suburban' ? 'active' : ''}`}
              onClick={() => setFilterCategory('suburban')}
            >
              Suburban (4)
            </button>
            <button
              type="button"
              className={`cat-pill ${filterCategory === 'background' ? 'active' : ''}`}
              onClick={() => setFilterCategory('background')}
            >
              Ecological (2)
            </button>
          </div>
        </div>
      </div>

      <div className="stations-layout">
        
        {/* Interactive SVG Beijing Map */}
        <div className="beijing-svg-map-wrapper">
          <svg viewBox="0 0 800 600" width="100%" height="100%">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(148, 163, 184, 0.05)" strokeWidth="1"/>
              </pattern>
              <linearGradient id="beijing-basin-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.08"/>
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.03"/>
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)"/>

            {/* Beijing Topographic Basin Outline */}
            <path
              d="M 120 180 Q 240 60 480 80 T 700 160 Q 750 320 680 460 T 420 560 Q 200 540 100 420 Z"
              fill="url(#beijing-basin-gradient)"
              stroke="rgba(56, 189, 248, 0.25)"
              strokeWidth="2"
              strokeDasharray="4 4"
            />

            {/* Yan Mountains Barrier Marker */}
            <path
              d="M 80 120 Q 240 40 500 50 T 720 120"
              fill="none"
              stroke="rgba(148, 163, 184, 0.2)"
              strokeWidth="1.5"
              strokeDasharray="6 3"
            />
            <text x="250" y="45" fill="#64748b" fontSize="10" fontFamily="var(--font-mono)" letterSpacing="2">▲ YAN MOUNTAINS BARRIER (NORTH) ▲</text>

            {/* Concentric Ring Road Overlays */}
            <circle cx="430" cy="380" r="60" fill="none" stroke="rgba(148, 163, 184, 0.16)" strokeWidth="1" strokeDasharray="3 3"/>
            <text x="495" y="380" fill="#64748b" fontSize="10" fontFamily="var(--font-mono)">3rd Ring</text>

            <circle cx="430" cy="380" r="110" fill="none" stroke="rgba(148, 163, 184, 0.13)" strokeWidth="1" strokeDasharray="3 3"/>
            <text x="545" y="380" fill="#64748b" fontSize="10" fontFamily="var(--font-mono)">5th Ring</text>

            <circle cx="430" cy="380" r="170" fill="none" stroke="rgba(148, 163, 184, 0.09)" strokeWidth="1" strokeDasharray="3 3"/>
            <text x="605" y="380" fill="#64748b" fontSize="10" fontFamily="var(--font-mono)">6th Ring</text>

            {/* Station Markers */}
            {availableStations.map((st) => {
              const { x, y } = getCoordinates(st.lat, st.lon);
              const isSelected = selectedStation.id === st.id;
              const isHovered = hoveredStation?.id === st.id;
              const isDimmed = filteredStations.length > 0 && !filteredStations.some(f => f.id === st.id);
              const badgeColor = getPm25BadgeColor(st.avg_pm25);

              return (
                <g
                  key={st.id}
                  transform={`translate(${x}, ${y})`}
                  style={{
                    cursor: 'pointer',
                    opacity: isDimmed ? 0.25 : 1,
                    transition: 'opacity 0.2s ease, transform 0.2s ease'
                  }}
                  onClick={() => setSelectedStationId(st.id)}
                  onMouseEnter={() => setHoveredStation(st)}
                  onMouseLeave={() => setHoveredStation(null)}
                >
                  {/* Glowing Radar Rings on Selection */}
                  {isSelected && (
                    <>
                      <circle r="18" fill="none" stroke="#38bdf8" strokeWidth="2" opacity="0.6">
                        <animate attributeName="r" values="8;24;8" dur="2s" repeatCount="indefinite"/>
                        <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite"/>
                      </circle>
                      <circle r="26" fill="rgba(56, 189, 248, 0.1)"/>
                    </>
                  )}

                  {/* Marker Pin Center */}
                  <circle
                    r={isSelected ? "9" : (isHovered ? "8" : "7")}
                    fill={badgeColor}
                    stroke="#ffffff"
                    strokeWidth={isSelected ? "2.5" : "1.8"}
                    filter={isSelected ? "drop-shadow(0 0 10px #38bdf8)" : undefined}
                  />

                  {/* Station Label */}
                  <text
                    x="12"
                    y="4"
                    fill={isSelected ? "#ffffff" : (isHovered ? "#38bdf8" : "#94a3b8")}
                    fontSize={isSelected ? "12" : "10"}
                    fontWeight={isSelected || isHovered ? "700" : "500"}
                    fontFamily="var(--font-sans)"
                  >
                    {st.id}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Station Detail Sidebar */}
        <div className="station-detail-sidebar">
          <div className="sidebar-header">
            <div className="station-type-tag" style={{ color: getPm25BadgeColor(selectedStation.avg_pm25) }}>
              {selectedStation.type}
            </div>
            <h3 className="sidebar-station-title">
              {selectedStation.name}
            </h3>
            <span className="mono sidebar-station-district">
              District: {selectedStation.district} &bull; Beijing Municipality
            </span>
          </div>

          <div className="station-kpi-row">
            <div className="station-kpi-box">
              <span className="kpi-micro-label">Latitude</span>
              <span className="mono kpi-micro-val">{selectedStation.lat}&deg; N</span>
            </div>
            <div className="station-kpi-box">
              <span className="kpi-micro-label">Longitude</span>
              <span className="mono kpi-micro-val">{selectedStation.lon}&deg; E</span>
            </div>
          </div>

          <div className="station-avg-card">
            <div className="kpi-micro-label">Historical Mean PM2.5</div>
            <div className="station-avg-num" style={{ color: getPm25BadgeColor(selectedStation.avg_pm25) }}>
              {selectedStation.avg_pm25} <span className="avg-unit">µg/m³</span>
            </div>
            <div className="avg-hint">
              {selectedStation.avg_pm25 < 70 ? 'Clean background baseline' : (selectedStation.avg_pm25 > 84 ? 'High pollution exposure corridor' : 'Typical municipal baseline')}
            </div>
          </div>

          <div className="station-desc-box">
            <div className="kpi-micro-label" style={{ marginBottom: '0.35rem' }}>Topographic Profile & Surroundings</div>
            <p className="station-desc-text">
              {selectedStation.desc}
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary load-forecaster-btn"
            onClick={() => onSelectStationForForecast(selectedStation.id)}
            disabled={!stationIds.includes(selectedStation.id)}
          >
            <span>Load into Forecaster</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

      </div>

      {/* Grid of Stations matching Filter */}
      <div className="station-grid-container">
        <div className="grid-meta-row">
          <span>Showing {filteredStations.length} of {availableStations.length} Monitoring Stations</span>
          {searchQuery && (
            <span className="filter-badge">Filter: "{searchQuery}"</span>
          )}
        </div>

        <div className="station-grid">
          {filteredStations.map((st) => {
            const isSelected = selectedStation.id === st.id;
            const badgeColor = getPm25BadgeColor(st.avg_pm25);

            return (
              <div
                key={st.id}
                className={`station-card ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedStationId(st.id)}
              >
                <div className="st-card-top">
                  <div className="st-name-row">
                    <span className="st-dot" style={{ backgroundColor: badgeColor }}></span>
                    <strong className="st-title">{st.id}</strong>
                  </div>
                  <span className="mono st-val" style={{ color: badgeColor }}>
                    {st.avg_pm25} µg/m³
                  </span>
                </div>
                <div className="st-card-sub">
                  {st.district} &bull; {st.type}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
