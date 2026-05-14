import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout.jsx';
import { generateAIPrediction, getSensorReadings } from '../services/api.js';

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

function Prediction({ user, online }) {
  const [batchId, setBatchId] = useState(1);
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
    const height = 380;
    const padding = 46;
    const plotWidth = width - padding * 2;
    const plotHeight = height - padding * 2;
    const xStep = history.length > 1 ? plotWidth / (history.length - 1) : plotWidth;

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
      seriesLines,
    };
  }, [sensorHistory, visibleSensors]);

  const latestReading = sensorHistory.length > 0 ? sensorHistory[sensorHistory.length - 1] : null;

  async function handleGeneratePrediction() {
    try {
      setLoading(true);
      setPredictionError(null);
      setPrediction(null);
      setPredictionModalOpen(true);

      const response = await generateAIPrediction(batchId, daysWindow);

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
                The system uses moisture, gas, temperature, humidity, fan logs,
                and water spray logs to estimate compost condition and readiness.
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
                onChange={(event) => setBatchId(Number(event.target.value))}
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

                  {Array.from({ length: 4 }).map((_, index) => {
                    const y = chartData.padding + (chartData.plotHeight / 3) * index;
                    return (
                      <line
                        key={index}
                        x1={chartData.padding}
                        x2={chartData.width - chartData.padding}
                        y1={y}
                        y2={y}
                        stroke="rgba(148, 163, 184, 0.12)"
                        strokeWidth="1"
                      />
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

            <div className="prediction-chart-footer">
              <div className="reading-summary-panel">
                <h4>Latest Data Snapshot</h4>
                {latestReading ? (
                  <div className="reading-row">
                    {SENSOR_SERIES.map((series) => (
                      <div key={series.id}>
                        <strong>{series.label}:</strong>
                        <p>
                          {formatValue(latestReading[series.field])} {series.unit}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No readings are available for this batch yet.</p>
                )}
              </div>

              <div className="chart-metrics-panel">
                <h4>Chart Metrics</h4>
                <ul>
                  <li>{sensorHistory.length} stored readings</li>
                  <li>{visibleSensors.length} active sensor series</li>
                  <li>{historyLoading ? 'Loading history...' : `${chartData.history.length} trend points`}</li>
                </ul>
              </div>
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
