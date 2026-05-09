import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout.jsx';
import { getAIPredictions } from '../services/api.js';

const sampleHistory = Array.from({ length: 20 }, (_, index) => {
  const time = `${index + 1}h`;
  return {
    time,
    temperature: 24 + Math.sin(index / 3) * 3 + Math.random() * 0.5,
    moisture: 58 + Math.cos(index / 4) * 8 + Math.random() * 0.5,
    gas: 950 + Math.sin(index / 2) * 140 + Math.random() * 8,
    humidity: 52 + Math.cos(index / 3) * 10 + Math.random() * 0.5,
  };
});

const sensorConfig = [
  { key: 'temperature', label: 'Temperature', unit: '°C', color: '#60a5fa' },
  { key: 'moisture', label: 'Moisture', unit: '%', color: '#38bdf8' },
  { key: 'gas', label: 'Gas Concentration', unit: 'PPM', color: '#f97316' },
  { key: 'humidity', label: 'Humidity', unit: '%', color: '#34d399' },
];

function Prediction({ user, online }) {
  const [activeSensors, setActiveSensors] = useState({
    temperature: true,
    moisture: true,
    gas: true,
    humidity: true,
  });
  const [predictionText, setPredictionText] = useState(['Loading AI prediction...']);
  const [predictionError, setPredictionError] = useState(null);

  const selectedSensors = sensorConfig.filter((sensor) => activeSensors[sensor.key]);

  useEffect(() => {
    async function fetchPrediction() {
      try {
        setPredictionError(null);
        const response = await getAIPredictions(selectedSensors.map((sensor) => sensor.key));
        setPredictionText(response.insights || ['No AI insight available.']);
      } catch (error) {
        setPredictionError('AI analysis unavailable. Try again later.');
        setPredictionText(['AI analysis unavailable.']);
      }
    }

    fetchPrediction();
  }, [selectedSensors]);

  const chartValues = useMemo(() => {
    const values = sampleHistory.map((point) => ({
      time: point.time,
      ...selectedSensors.reduce((acc, sensor) => {
        acc[sensor.key] = point[sensor.key];
        return acc;
      }, {}),
    }));

    const maxValue = Math.max(
      ...selectedSensors.flatMap((sensor) => sampleHistory.map((item) => item[sensor.key]))
    );
    const minValue = Math.min(
      ...selectedSensors.flatMap((sensor) => sampleHistory.map((item) => item[sensor.key]))
    );

    return { values, maxValue, minValue };
  }, [selectedSensors]);

  const getPath = (key, color) => {
    const points = sampleHistory.map((item, index) => {
      const x = (index / (sampleHistory.length - 1)) * 100;
      const range = chartValues.maxValue - chartValues.minValue || 1;
      const y = 100 - ((item[key] - chartValues.minValue) / range) * 100;
      return `${index === 0 ? 'M' : 'L'} ${x}% ${y}%`;
    });
    return <path d={points.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />;
  };

  return (
    <Layout
      user={user}
      title="AI Prediction"
      subtitle="Sensor trends, forecasting, and model insights"
      online={online}
    >
      <div className="prediction-grid">
        <div className="prediction-card">
          <div className="section-header">
            <div>
              <h2>AI Prediction</h2>
              <p>Filter the sensor graph below and review predicted trends.</p>
            </div>
          </div>

          <div className="prediction-controls">
            {sensorConfig.map((sensor) => (
              <button
                key={sensor.key}
                className={`sensor-toggle ${activeSensors[sensor.key] ? 'active' : ''}`}
                onClick={() =>
                  setActiveSensors((prev) => ({
                    ...prev,
                    [sensor.key]: !prev[sensor.key],
                  }))
                }
              >
                {activeSensors[sensor.key] ? 'Hide' : 'Show'} {sensor.label}
              </button>
            ))}
          </div>

          <div className="chart-frame">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="sensor-chart">
              <g opacity="0.2">
                {[...Array(5)].map((_, index) => (
                  <line
                    key={index}
                    x1="0"
                    x2="100"
                    y1={`${(index * 25)}%`}
                    y2={`${(index * 25)}%`}
                    stroke="rgba(148, 163, 184, 0.2)"
                    strokeWidth="0.5"
                  />
                ))}
              </g>
              {selectedSensors.map((sensor) => getPath(sensor.key, sensor.color))}
            </svg>
          </div>

          <div className="legend-list">
            {selectedSensors.map((sensor) => (
              <div key={sensor.key} className="legend-item">
                <span className="legend-swatch" style={{ background: sensor.color }} />
                <span>{sensor.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="prediction-summary">
          <h3>AI Insight</h3>
          {predictionText.map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export default Prediction;
