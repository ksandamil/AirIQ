import { useCallback, useEffect, useRef, useState } from 'react';
import type { AtmosphericState, PredictionResult } from './types';
import { fetchStations, predictNextHour } from './services/inferenceEngine';

import { Header } from './components/Header';
import { AppHero } from './components/AppHero';
import { ForecasterTab } from './components/ForecasterTab';
import { StationsTab } from './components/StationsTab';
import { Footer } from './components/Footer';

const DEFAULT_STATION = 'Aotizhongxin';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('forecaster');
  const [state, setState] = useState<AtmosphericState>({ station: DEFAULT_STATION });
  const [stations, setStations] = useState<string[]>([]);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestController = useRef<AbortController | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchStations()
      .then((availableStations) => {
        if (!isMounted) return;
        setStations(availableStations);
        setState((current) => ({
          station: availableStations.includes(current.station)
            ? current.station
            : availableStations[0] || DEFAULT_STATION
        }));
      })
      .catch((requestError: unknown) => {
        if (isMounted) {
          setError(requestError instanceof Error ? requestError.message : 'Unable to load monitoring stations.');
        }
      });

    return () => {
      isMounted = false;
      requestController.current?.abort();
    };
  }, []);

  const runPrediction = useCallback(async () => {
    if (requestController.current || !stations.includes(state.station)) return;

    const controller = new AbortController();
    requestController.current = controller;
    setIsLoading(true);
    setError(null);
    setPrediction(null);

    try {
      const result = await predictNextHour(state.station, controller.signal);
      if (requestController.current === controller) {
        setPrediction(result);
      }
    } catch (requestError: unknown) {
      if (controller.signal.aborted) return;
      if (requestController.current === controller) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to generate a prediction.');
      }
    } finally {
      if (requestController.current === controller) {
        requestController.current = null;
        setIsLoading(false);
      }
    }
  }, [state.station, stations]);

  const handleStationChange = useCallback((station: string) => {
    requestController.current?.abort();
    requestController.current = null;
    setIsLoading(false);
    setState({ station });
    setPrediction(null);
    setError(null);
  }, []);

  const handleReset = useCallback(() => {
    handleStationChange(stations.includes(DEFAULT_STATION) ? DEFAULT_STATION : stations[0] || DEFAULT_STATION);
  }, [handleStationChange, stations]);

  const handleSelectStationForForecast = (stationId: string) => {
    if (!stations.includes(stationId)) return;
    handleStationChange(stationId);
    setActiveTab('forecaster');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const tag = document.activeElement?.tagName.toLowerCase() || '';
      if (tag === 'input' || tag === 'select' || tag === 'textarea') return;

      if (event.key === '1') setActiveTab('forecaster');
      if (event.key === '2') setActiveTab('stations');
      if (event.key === 'r' || event.key === 'R') handleReset();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleReset]);

  return (
    <>
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onReset={handleReset}
      />

      <main className="main-wrapper">
        <AppHero />

        {activeTab === 'forecaster' && (
          <ForecasterTab
            station={state.station}
            onStationChange={handleStationChange}
            prediction={prediction}
            stations={stations}
            isLoading={isLoading}
            error={error}
            onPredict={runPrediction}
          />
        )}

        {activeTab === 'stations' && (
          <StationsTab
            onSelectStationForForecast={handleSelectStationForForecast}
            stationIds={stations}
          />
        )}
      </main>

      <Footer />
    </>
  );
}

export default App;
