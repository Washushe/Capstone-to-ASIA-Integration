import { useState } from 'react';
import Layout from '../components/Layout.jsx';
import { generateAIPrediction } from '../services/api.js';

function Prediction({ user, online }) {
  const [batchId, setBatchId] = useState(1);
  const [daysWindow, setDaysWindow] = useState(21);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [predictionError, setPredictionError] = useState(null);

  async function handleGeneratePrediction() {
    try {
      setLoading(true);
      setPredictionError(null);
      setPrediction(null);

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
              className="sensor-toggle active"
              onClick={handleGeneratePrediction}
              disabled={loading}
            >
              {loading ? 'Generating AI Prediction...' : 'Generate Prediction'}
            </button>
          </div>

          {predictionError && (
            <div className="error-box">
              <strong>Error:</strong> {predictionError}
            </div>
          )}

          <div className="chart-frame">
            <div className="prediction-info-box">
              <h3>Data Used for Prediction</h3>
              <p>
                This prediction is generated from the selected compost batch using
                sensor readings and actuator activity stored in the database.
              </p>

              <div className="legend-list">
                <div className="legend-item">
                  <span className="legend-swatch" />
                  <span>Moisture Sensor</span>
                </div>

                <div className="legend-item">
                  <span className="legend-swatch" />
                  <span>Gas Sensor</span>
                </div>

                <div className="legend-item">
                  <span className="legend-swatch" />
                  <span>Temperature Sensor</span>
                </div>

                <div className="legend-item">
                  <span className="legend-swatch" />
                  <span>Humidity Sensor</span>
                </div>

                <div className="legend-item">
                  <span className="legend-swatch" />
                  <span>Fan and Water Spray Logs</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="prediction-summary">
          <h3>AI Prediction Result</h3>

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
    </Layout>
  );
}

export default Prediction;