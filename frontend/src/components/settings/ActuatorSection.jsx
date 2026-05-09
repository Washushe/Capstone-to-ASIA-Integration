import { useState, useEffect } from 'react';
import { getLatestSensorSnapshot, getThresholds as getLocalThresholds } from '../../services/mockSensors.js';
import { getThresholdSettings } from '../../services/api.js';

function ActuatorSection() {
  const [sensorSnapshot, setSensorSnapshot] = useState(null);
  const [thresholds, setThresholds] = useState({ moistureMin: 50, gasMax: 1500 });

  useEffect(() => {
    const snapshot = getLatestSensorSnapshot();
    if (snapshot) {
      setSensorSnapshot(snapshot);
    }

    async function loadThresholds() {
      try {
        const settings = await getThresholdSettings();
        setThresholds({
          moistureMin: settings.moistureMin ?? 50,
          gasMax: settings.gasMax ?? 1500,
        });
      } catch {
        setThresholds(getLocalThresholds());
      }
    }

    loadThresholds();
  }, []);

  const getValue = (id) => sensorSnapshot?.find((item) => item.id === id)?.value;
  const moisture = getValue('moisture');
  const gas = getValue('gas');
  const temperature = getValue('temperature');

  const fanActive = gas > thresholds.gasMax || temperature > 35;
  const waterActive = moisture < thresholds.moistureMin;
  const heaterActive = temperature < 25;
  const stirrerActive = moisture < thresholds.moistureMin || gas > thresholds.gasMax;

  const statusText = (active, label) => (active ? `${label} Active` : `${label} Idle`);

  return (
    <div className="info-box settings-full-box">
      <h4>Actuator Controls</h4>
      <p>These statuses reflect current actuator activity based on the latest sensor snapshot.</p>
      <div className="actuator-status-grid">
        <div className="actuator-card">
          <div className="actuator-title">Fan</div>
          <div className={`actuator-badge ${fanActive ? 'active' : 'inactive'}`}>
            {statusText(fanActive, 'Fan')}
          </div>
          <p>{fanActive ? 'Cooling and venting are active.' : 'Fan is idle.'}</p>
        </div>
        <div className="actuator-card">
          <div className="actuator-title">Water Pump</div>
          <div className={`actuator-badge ${waterActive ? 'active' : 'inactive'}`}>
            {statusText(waterActive, 'Water pump')}
          </div>
          <p>{waterActive ? 'Moisture is low; pump is engaged.' : 'Moisture is within range.'}</p>
        </div>
      </div>
      <p className="note-text">This is a simulated actuator status indicator. No hardware is currently connected.</p>
    </div>
  );
}

export default ActuatorSection;
