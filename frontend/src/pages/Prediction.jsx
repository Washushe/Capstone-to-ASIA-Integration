import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout.jsx';
import {
  generateAIPrediction,
  getActiveCompostBatch,
  getSensorReadings,
} from '../services/api.js';

const SENSOR_SERIES = [
  { id: 'moisture', label: 'Moisture', field: 'moistureLevel', color: '#60A5FA', unit: '%' },
  { id: 'gas', label: 'Gas', field: 'gasLevel', color: '#f97316', unit: 'index' },
  { id: 'temperature', label: 'Temperature', field: 'temperatureC', color: '#fb7185', unit: '\u00B0C' },
  { id: 'humidity', label: 'Humidity', field: 'humidityLevel', color: '#34d399', unit: '%' },
];

function formatStatus(value) {
  if (!value) return 'Unknown';
  if (value === 'NORMAL') return 'Optimal';
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function formatValue(value) {
  return value === null || value === undefined ? '--' : value.toFixed(1);
}

function formatAxisValue(value) {
  if (!Number.isFinite(value)) return '--';
  return Math.abs(value) >= 100 ? Math.round(value).toString() : value.toFixed(1);
}

function formatAxisTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return { time: '--', date: '' };
  }

  return {
    time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: date.toLocaleDateString([], { month: 'short', day: 'numeric' }),
  };
}

function Prediction({ user, online }) {
  const [batchId, setBatchId] = useState('');
  const [activeBatch, setActiveBatch] = useState(null);
  const [daysWindow, setDaysWindow] = useState(21);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [predictionError, setPredictionError] = useState(null);
  const [predictionModalOpen, setPredictionModalOpen] = useState(false);
  const [sensorHistory, setSensorHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [activeSeries, setActiveSeries] = useState({
    moisture: true,
    gas: true,
    temperature: true,
    humidity: true,
  });
  const [hoverInfo, setHoverInfo] = useState(null);

  useEffect(() => {
    async function loadSensorHistory() {
      try {
        const active = await getActiveCompostBatch().catch(() => null);
        setActiveBatch(active);
        setBatchId(active?.batchId || '');

        const readings = await getSensorReadings();
        const history = Array.isArray(readings) ? readings.slice(0, 60).reverse() : [];
        setSensorHistory(history);
      } catch {
        setSensorHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    }

    loadSensorHistory();
  }, []);

  const visibleSensors = SENSOR_SERIES.filter((series) => activeSeries[series.id]);

  const chartData = useMemo(() => {
    const history = sensorHistory.slice(-40);
    const dataValues = [];

    history.forEach((reading) => {
      visibleSensors.forEach((series) => {
        const value = reading[series.field];
        if (value !== null && value !== undefined) {
          dataValues.push(value);
        }
      });
    });

    const minValue = dataValues.length ? Math.min(...dataValues) : 0;
    const maxValue = dataValues.length ? Math.max(...dataValues) : 100;
    const range = Math.max(maxValue - minValue, 10);
    const chartMin = Math.max(0, minValue - range * 0.1);
    const chartMax = maxValue + range * 0.1;

    const width = 1120;
    const height = 420;
    const padding = 76;
    const plotWidth = width - padding * 2;
    const plotHeight = height - padding * 2;
    const xStep = history.length > 1 ? plotWidth / (history.length - 1) : plotWidth;
    const yTicks = Array.from({ length: 5 }).map((_, index) => {
      const ratio = index / 4;
      const value = chartMax - (chartMax - chartMin) * ratio;
      const y = padding + plotHeight * ratio;
      return { value, y };
    });
    const xTickCount = Math.min(5, history.length);
    const xTicks = Array.from({ length: xTickCount }).map((_, index) => {
      const readingIndex = xTickCount === 1
        ? 0
        : Math.round((index * (history.length - 1)) / (xTickCount - 1));
      const reading = history[readingIndex];
      const x = padding + readingIndex * xStep;
      return { reading, x };
    });

    const seriesLines = visibleSensors.map((series) => {
      const points = history
        .map((reading, index) => {
          const value = reading[series.field];
          if (value === null || value === undefined) return null;

          const x = padding + index * xStep;
          const y = padding + plotHeight * (1 - (value - chartMin) / (chartMax - chartMin));
          return { x, y, value, reading, series };
        })
        .filter(Boolean);

      return {
        series,
        points,
        path: points.map((point) => `${point.x},${point.y}`).join(' '),
      };
    });

    return {
      history,
      chartMin,
      chartMax,
      width,
      height,
      padding,
      plotWidth,
      plotHeight,
      xStep,
      yTicks,
      xTicks,
      seriesLines,
    };
  }, [sensorHistory, visibleSensors]);

  async function handleGeneratePrediction() {
    try {
      setLoading(true);
      setPredictionError(null);
      setPrediction(null);
      setPredictionModalOpen(true);

      const response = await generateAIPrediction(batchId || null, daysWindow);

      setPrediction(response);
    } catch (error) {
      setPredictionError(error.message || 'AI prediction is currently unavailable.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout
      user={user}
      title="AI Prediction"
      subtitle="Compost readiness prediction based on sensor readings and actuator logs"
      online={online}
    >
      <div className="prediction-grid">
        <div className="prediction-card">
          <div className="section-header">
            <div>
              <h2>Generate AI Prediction</h2>
              <p>
                {activeBatch
                  ? `Active batch: ${activeBatch.batchCode} - ${activeBatch.batchName}`
                  : 'Select a batch ID or activate a compost batch in Settings.'}
              </p>
            </div>
          </div>

          <div className="prediction-controls">
            <div className="form-group">
              <label>Compost Batch ID</label>
              <input
                type="number"
                min="1"
                value={batchId}
                onChange={(event) => setBatchId(event.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Analysis Window, in days</label>
              <input
                type="number"
                min="1"
                value={daysWindow}
                onChange={(event) => setDaysWindow(Number(event.target.value))}
              />
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={handleGeneratePrediction}
              disabled={loading}
            >
              {loading ? 'Generating AI Prediction...' : 'Generate Prediction'}
            </button>
          </div>

          {(prediction || predictionError) && !loading && (
            <button
              type="button"
              className="secondary-button prediction-open-button"
              onClick={() => setPredictionModalOpen(true)}
            >
              View Prediction Result
            </button>
          )}

          <div className="chart-frame">
            <div className="chart-header-row">
              <div>
                <h3>Sensor Trend Chart</h3>
                <p>
                  Review the latest sensor history and track how actuator-set thresholds influence compost conditions.
                </p>
              </div>
              <div className="legend-toggle-row">
                {SENSOR_SERIES.map((series) => (
                  <button
                    key={series.id}
                    type="button"
                    className={`series-toggle ${activeSeries[series.id] ? 'active' : ''}`}
                    onClick={() => setActiveSeries((prev) => ({ ...prev, [series.id]: !prev[series.id] }))}
                    style={{ borderColor: series.color }}
                  >
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 9999,
                        background: series.color,
                        display: 'inline-block',
                        marginRight: 8,
                      }}
                    />
                    {series.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="sensor-chart-wrapper">
              {historyLoading ? (
                <div className="empty-state">Loading historical sensor readings...</div>
              ) : chartData.history.length === 0 ? (
                <div className="empty-state">No sensor history available yet.</div>
              ) : (
                <svg className="sensor-chart" viewBox={`0 0 ${chartData.width} ${chartData.height}`}>
                  <rect x="0" y="0" width="100%" height="100%" fill="transparent" />

                  <line
                    x1={chartData.padding}
                    x2={chartData.padding}
                    y1={chartData.padding}
                    y2={chartData.height - chartData.padding}
                    className="chart-axis-line"
                  />
                  <line
                    x1={chartData.padding}
                    x2={chartData.width - chartData.padding}
                    y1={chartData.height - chartData.padding}
                    y2={chartData.height - chartData.padding}
                    className="chart-axis-line"
                  />

                  {chartData.yTicks.map((tick) => (
                    <g key={`y-${tick.value}`}>
                      <line
                        x1={chartData.padding}
                        x2={chartData.width - chartData.padding}
                        y1={tick.y}
                        y2={tick.y}
                        stroke="rgba(148, 163, 184, 0.12)"
                        strokeWidth="1"
                      />
                      <text
                        x={chartData.padding - 12}
                        y={tick.y + 5}
                        className="chart-axis-label"
                        textAnchor="end"
                      >
                        {formatAxisValue(tick.value)}
                      </text>
                    </g>
                  ))}

                  {chartData.xTicks.map((tick, index) => {
                    const label = formatAxisTime(tick.reading.createdAt);
                    return (
                      <g key={`${tick.reading.readingId || tick.reading.createdAt}-${index}`}>
                        <line
                          x1={tick.x}
                          x2={tick.x}
                          y1={chartData.height - chartData.padding}
                          y2={chartData.height - chartData.padding + 8}
                          className="chart-axis-line"
                        />
                        <text
                          x={tick.x}
                          y={chartData.height - chartData.padding + 26}
                          className="chart-axis-label"
                          textAnchor="middle"
                        >
                          <tspan x={tick.x}>{label.time}</tspan>
                          <tspan x={tick.x} dy="18">{label.date}</tspan>
                        </text>
                      </g>
                    );
                  })}

                  {chartData.seriesLines.map(({ series, path }) => (
                    <path
                      key={series.id}
                      d={`M${path}`}
                      fill="none"
                      stroke={series.color}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ))}

                  {chartData.seriesLines.flatMap(({ series, points }) =>
                    points.map((point, index) => (
                      <circle
                        key={`${series.id}-${index}`}
                        cx={point.x}
                        cy={point.y}
                        r="4"
                        fill={series.color}
                        stroke="#0f172a"
                        strokeWidth="2"
                        onMouseEnter={() => setHoverInfo({ series, point })}
                        onMouseLeave={() => setHoverInfo(null)}
                      />
                    ))
                  )}
                </svg>
              )}

              {hoverInfo && (
                <div className="chart-tooltip">
                  <div className="tooltip-row">
                    <strong>{hoverInfo.series.label}</strong>
                    <span>
                      {formatValue(hoverInfo.point.value)} {hoverInfo.series.unit}
                    </span>
                  </div>
                  <div className="tooltip-row">
                    <span>Timestamp</span>
                    <span>{new Date(hoverInfo.point.reading.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="tooltip-row">
                    <span>Status</span>
                    <span>
                      {formatStatus(hoverInfo.point.reading[`${hoverInfo.series.id}Status`] || null)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {predictionModalOpen && (
        <div className="prediction-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="prediction-modal-title">
          <div className="prediction-modal">
            <div className="prediction-modal-header">
              <h3 id="prediction-modal-title">AI Prediction Result</h3>
              <button
                type="button"
                className="prediction-modal-close"
                onClick={() => setPredictionModalOpen(false)}
                aria-label="Close prediction result"
              >
                x
              </button>
            </div>

            {!prediction && !loading && !predictionError && (
              <p>
                No prediction generated yet. Click the generate button to request
                an AI prediction from the Spring Boot backend.
              </p>
            )}

            {loading && (
              <p>
                Please wait while the system analyzes the compost batch data using
                the AI prediction service.
              </p>
            )}

            {predictionError && (
              <div className="error-box">
                <strong>Error:</strong> {predictionError}
              </div>
            )}

            {prediction && (
              <>
                <div className="prediction-result-row">
                  <strong>Status:</strong>
                  <span>{prediction.success ? 'Success' : 'Failed'}</span>
                </div>

                <div className="prediction-result-row">
                  <strong>Predicted Condition:</strong>
                  <span>{prediction.predictedCondition || 'Not available'}</span>
                </div>

                <div className="prediction-result-row">
                  <strong>Estimated Ready Date:</strong>
                  <span>{prediction.estimatedReadyDate || 'Not available'}</span>
                </div>

                <div className="prediction-result-row">
                  <strong>Estimated Days Remaining:</strong>
                  <span>
                    {prediction.estimatedDaysRemaining !== null &&
                    prediction.estimatedDaysRemaining !== undefined
                      ? `${prediction.estimatedDaysRemaining} day/s`
                      : 'Not available'}
                  </span>
                </div>

                <div className="prediction-result-row">
                  <strong>Confidence Score:</strong>
                  <span>
                    {prediction.confidenceScore !== null &&
                    prediction.confidenceScore !== undefined
                      ? prediction.confidenceScore
                      : 'Not available'}
                  </span>
                </div>

                <hr />

                <h4>Prediction Summary</h4>
                <p>{prediction.predictionSummary || 'No prediction summary available.'}</p>

                <h4>Trend Summary</h4>
                <p>{prediction.trendSummary || 'No trend summary available.'}</p>

                <h4>Recommendation</h4>
                <p>{prediction.recommendation || 'No recommendation available.'}</p>
              </>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Prediction;
