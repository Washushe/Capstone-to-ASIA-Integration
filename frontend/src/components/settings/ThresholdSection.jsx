import { useState, useEffect } from 'react';
import { getThresholdSettings, saveThresholdSettings } from '../../services/api.js';
import { getThresholds as getLocalThresholds, saveThresholds as saveLocalThresholds } from '../../services/mockSensors.js';

function ThresholdSection() {
  const [thresholds, setThresholds] = useState({
    moistureMin: '',
    gasMax: '',
  });
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState(''); // 'success' or 'error'

  useEffect(() => {
    async function loadThresholds() {
      try {
        const data = await getThresholdSettings();
        setThresholds({
          moistureMin: data.moistureMin ?? 50,
          gasMax: data.gasMax ?? 1200,
        });
      } catch {
        setThresholds(getLocalThresholds());
      }
    }

    loadThresholds();
  }, []);

  const handleChange = (key, value) => {
    setThresholds((prev) => ({
      ...prev,
      [key]: value === '' ? '' : Number(value),
    }));
  };

  const handleSave = async () => {
    try {
      const saved = await saveThresholdSettings({
        moistureMin: thresholds.moistureMin,
        gasMax: thresholds.gasMax,
      });
      setThresholds({
        moistureMin: saved.moistureMin,
        gasMax: saved.gasMax,
      });
      saveLocalThresholds({
        moistureMin: saved.moistureMin,
        gasMax: saved.gasMax,
      });
      setStatusMessage('Sensor data threshold has been set.');
      setStatusType('success');
    } catch (error) {
      saveLocalThresholds(thresholds);
      setStatusMessage('Unable to save to backend. Values are saved locally.');
      setStatusType('error');
    }
  };

  return (
    <div className="info-box settings-full-box">
      <h4>Threshold Setting</h4>
      <p>Only the moisture and gas thresholds are saved. These values are used by the dashboard and stored in the database.</p>

      <div className="threshold-form">
        <div className="threshold-group">
          <h5>Moisture (%)</h5>
          <div className="threshold-inputs">
            <label>
              Min:
              <input
                type="number"
                value={thresholds.moistureMin}
                onChange={(e) => handleChange('moistureMin', e.target.value)}
                placeholder="50"
              />
            </label>
          </div>
        </div>

        <div className="threshold-group">
          <h5>Gas Concentration (PPM)</h5>
          <div className="threshold-inputs">
            <label>
              Max:
              <input
                type="number"
                value={thresholds.gasMax}
                onChange={(e) => handleChange('gasMax', e.target.value)}
                placeholder="1200"
              />
            </label>
          </div>
        </div>

        <button className="save-button" onClick={handleSave}>
          Save Changes
        </button>
        {statusMessage && (
          <p className={`form-message ${statusType}`}>
            {statusMessage}
          </p>
        )}
      </div>
    </div>
  );
}

export default ThresholdSection;
