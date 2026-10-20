import React, { useEffect, useState } from 'react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onReset: () => void;
}

const TABS = [
  {
    id: 'forecaster',
    label: 'Forecaster',
    hint: '1',
    title: 'Next-hour PM2.5 forecaster (press 1)',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 17l6-6 4 4 8-8" />
        <path d="M14 7h7v7" />
      </svg>
    ),
  },
  {
    id: 'stations',
    label: 'Stations',
    hint: '2',
    title: '12 monitoring stations (press 2)',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
];

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Shanghai',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const HEADER_CSS = `
.aiq-header {
  --aiq-bg: rgba(255, 255, 255, 0.82);
  --aiq-border: #e4e7ec;
  --aiq-text: #101828;
  --aiq-muted: #667085;
  --aiq-hover: #f2f4f7;
  --aiq-accent: #2563eb;
  --aiq-accent-soft: #eff4ff;
  --aiq-ok: #16a34a;

  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--aiq-bg);
  backdrop-filter: saturate(180%) blur(12px);
  -webkit-backdrop-filter: saturate(180%) blur(12px);
  border-bottom: 1px solid var(--aiq-border);
  color: var(--aiq-text);
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}

@media (prefers-color-scheme: dark) {
  .aiq-header {
    --aiq-bg: rgba(16, 20, 28, 0.82);
    --aiq-border: #262c38;
    --aiq-text: #f2f4f7;
    --aiq-muted: #98a2b3;
    --aiq-hover: #1b212c;
    --aiq-accent: #60a5fa;
    --aiq-accent-soft: #172036;
    --aiq-ok: #4ade80;
  }
}

.aiq-header svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex-shrink: 0;
}

.aiq-header__inner {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;
  height: 60px;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 20px;
}

.aiq-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  justify-self: start;
  color: inherit;
  text-decoration: none;
  border-radius: 8px;
}
.aiq-brand__logo {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: var(--aiq-accent);
  color: #fff;
}
.aiq-brand__name {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.aiq-brand__badge {
  padding: 2px 7px;
  border-radius: 999px;
  background: var(--aiq-accent-soft);
  color: var(--aiq-accent);
  font-size: 11px;
  font-weight: 600;
}

.aiq-nav {
  display: flex;
  gap: 4px;
  padding: 4px;
  border-radius: 10px;
  background: var(--aiq-hover);
}
.aiq-tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 12px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--aiq-muted);
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
}
.aiq-tab:hover { color: var(--aiq-text); }
.aiq-tab.is-active {
  background: var(--aiq-bg);
  color: var(--aiq-text);
  box-shadow: 0 0 0 1px var(--aiq-border), 0 1px 2px rgba(16, 24, 40, 0.08);
}
.aiq-tab__kbd {
  min-width: 18px;
  padding: 1px 5px;
  border: 1px solid var(--aiq-border);
  border-radius: 5px;
  color: var(--aiq-muted);
  font: inherit;
  font-size: 11px;
  text-align: center;
}

.aiq-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}
.aiq-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--aiq-muted);
}
.aiq-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  color: var(--aiq-text);
}
.aiq-status__dot {
  position: relative;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--aiq-ok);
}
.aiq-status__dot::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: var(--aiq-ok);
  animation: aiq-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
}
@keyframes aiq-ping {
  75%, 100% { transform: scale(2.4); opacity: 0; }
}
.aiq-divider {
  width: 1px;
  height: 16px;
  background: var(--aiq-border);
}
.aiq-clock { font-variant-numeric: tabular-nums; }
.aiq-clock__zone { font-size: 11px; }

.aiq-icon-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 12px;
  border: 1px solid var(--aiq-border);
  border-radius: 8px;
  background: transparent;
  color: var(--aiq-text);
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}
.aiq-icon-btn:hover { background: var(--aiq-hover); }

.aiq-header a:focus-visible,
.aiq-header button:focus-visible {
  outline: 2px solid var(--aiq-accent);
  outline-offset: 2px;
}

@media (max-width: 960px) {
  .aiq-clock, .aiq-divider, .aiq-tab__kbd { display: none; }
}
@media (max-width: 640px) {
  .aiq-header__inner {
    grid-template-columns: auto 1fr auto;
    gap: 8px;
    padding: 0 12px;
  }
  .aiq-brand__name,
  .aiq-brand__badge,
  .aiq-status__text,
  .aiq-icon-btn__label { display: none; }
  .aiq-nav { justify-self: center; }
  .aiq-icon-btn { width: 34px; padding: 0; justify-content: center; }
}
@media (prefers-reduced-motion: reduce) {
  .aiq-status__dot::after { animation: none; }
  .aiq-tab, .aiq-icon-btn { transition: none; }
}
`;

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onReset }) => {
  const [time, setTime] = useState('--:--');

  useEffect(() => {
    const tick = () => setTime(timeFormatter.format(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <style>{HEADER_CSS}</style>
      <header className="aiq-header">
        <div className="aiq-header__inner">
          {/* Brand */}
          <a
            href="#"
            className="aiq-brand"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('forecaster');
            }}
            aria-label="AirIQ home"
          >
            <span className="aiq-brand__logo">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
              </svg>
            </span>
            <span className="aiq-brand__name">AirIQ</span>
            <span className="aiq-brand__badge">Pro</span>
          </a>

          {/* Navigation */}
          <nav className="aiq-nav" role="tablist" aria-label="Main navigation">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  title={tab.title}
                  className={`aiq-tab${active ? ' is-active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon}
                  <span className="aiq-tab__label">{tab.label}</span>
                  <kbd className="aiq-tab__kbd">{tab.hint}</kbd>
                </button>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="aiq-actions">
            <div className="aiq-meta" title="Beijing time (UTC+8) · 12 stations reporting">
              <span className="aiq-status" role="status">
                <span className="aiq-status__dot" />
                <span className="aiq-status__text">Live</span>
              </span>
              <span className="aiq-divider" aria-hidden="true" />
              <span className="aiq-clock">
                {time} <span className="aiq-clock__zone">CST</span>
              </span>
            </div>

            <button
              type="button"
              className="aiq-icon-btn"
              onClick={onReset}
              title="Reset station selection"
              aria-label="Reset station selection"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              <span className="aiq-icon-btn__label">Reset</span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
};