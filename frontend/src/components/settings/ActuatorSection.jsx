import { useState, useEffect } from 'react';
import {
  getLatestSensorReading,
  getSensorReadings,
  getThresholdSettings,
} from '../../services/api.js';

const GAS_HIGH_THRESHOLD = 1200;
const defaultThresholds = { moistureMin: 50, gasMax: GAS_HIGH_THRESHOLD };

function getActuatorEvent(reading, thresholds) {
  const gasHigh = reading.gasStatus === 'HIGH';
  const moistureLow = reading.moistureStatus === 'LOW';
  const moistureHigh = reading.moistureStatus === 'HIGH';
  const temperatureHigh = reading.temperatureC > 35;

  if (gasHigh || temperatureHigh) {
    return {
      event: 'Fan activated for 5 seconds',
      cause: 'Gas exceeded threshold limit',
      status: 'HIGH',
    };
  }

  if (moistureLow) {
    return {
      event: 'Water pump activated for 5 seconds',
      cause: 'Moisture dropped below threshold limit',
      status: 'LOW',
    };
  }

  if (moistureHigh) {
    return {
      event: 'Moisture release system activated for 5 seconds',
      cause: 'Moisture exceeded safe range',
      status: 'HIGH',
    };
  }

  return {
    event: 'No actuator event triggered',
    cause: 'All sensor levels are within normal thresholds',
    status: 'NORMAL',
  };
}

function ActuatorSection() {
  const [latestReading, setLatestReading] = useState(null);
  const [history, setHistory] = useState([]);
  const [thresholds, setThresholds] = useState(defaultThresholds);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [settings, allReadings] = await Promise.all([
          getThresholdSettings(),
          getSensorReadings(),
        ]);
        setThresholds({
          moistureMin: settings.moistureMin ?? 50,
          gasMax: settings.gasMax ?? GAS_HIGH_THRESHOLD,
        });
        setHistory(allReadings);
        setLatestReading(allReadings?.[0] ?? null);
      } catch {
        setThresholds(defaultThresholds);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="info-box settings-full-box">
        <h4>Actuator Controls</h4>
        <p>Loading latest actuator status...</p>
      </div>
    );
  }

  if (!latestReading) {
    return (
      <div className="info-box settings-full-box">
        <h4>Actuator Controls</h4>
        <p>No sensor reading is available yet to calculate actuator behavior.</p>
      </div>
    );
  }

  const { moistureLevel, gasLevel, temperatureC } = latestReading;
  const fanActive = gasLevel > GAS_HIGH_THRESHOLD || temperatureC > 35;
  const waterActive = moistureLevel < thresholds.moistureMin;

  return (
    <div className="info-box settings-full-box">
      <h4>Actuator Controls</h4>
      <p>Actuator status is simulated from the latest recorded sensor reading and current threshold settings.</p>

      <div className="actuator-status-grid">
        <div className="actuator-card">
          <div className="actuator-title">Fan</div>
          <div className={`actuator-badge ${fanActive ? 'active' : 'inactive'}`}>
            {fanActive ? 'Running' : 'Idle'}
          </div>
          <p>{fanActive ? 'Fan is running to reduce high gas/temperature levels.' : 'Fan is not currently required.'}</p>
        </div>
        <div className="actuator-card">
          <div className="actuator-title">Water Pump</div>
          <div className={`actuator-badge ${waterActive ? 'active' : 'inactive'}`}>
            {waterActive ? 'Running' : 'Idle'}
          </div>
          <p>{waterActive ? 'Water pump is active due to moisture below threshold.' : 'Moisture is within the normal range.'}</p>
        </div>
      </div>
    </div>
  );
}

export default ActuatorSection;
