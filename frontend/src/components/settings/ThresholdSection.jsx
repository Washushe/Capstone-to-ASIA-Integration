import { useState, useEffect } from 'react';
import { getThresholdSettings, saveThresholdSettings } from '../../services/api.js';
import { getThresholds as getLocalThresholds, saveThresholds as saveLocalThresholds } from '../../services/mockSensors.js';

const defaultThresholds = {
  moistureMin: 50,
  gasMax: 1200,
  readingIntervalSeconds: 30,
  sprayDurationSeconds: 5,
  fanDurationSeconds: 5,
  sprayCooldownSeconds: 30,
  fanCooldownSeconds: 30,
};

function ThresholdSection() {
  const [thresholds, setThresholds] = useState(defaultThresholds);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('');
  const [passwordPromptOpen, setPasswordPromptOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadThresholds() {
      try {
        const data = await getThresholdSettings();
        setThresholds({
          ...defaultThresholds,
          ...data,
        });
      } catch {
        setThresholds({
          ...defaultThresholds,
          ...getLocalThresholds(),
        });
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

  const handleSave = () => {
    setStatusMessage('');
    setStatusType('');
    setCurrentPassword('');
    setPasswordError('');
    setPasswordPromptOpen(true);
  };

  const confirmSave = async (event) => {
    event.preventDefault();
    setStatusMessage('');
    setStatusType('');
    setPasswordError('');

    if (!currentPassword) {
      setPasswordError('Enter your current password to save threshold settings.');
      return;
    }

    setSaving(true);

    try {
      const saved = await saveThresholdSettings({
        ...thresholds,
        currentPassword,
      });
      const nextThresholds = {
        ...defaultThresholds,
        ...saved,
      };

      setThresholds(nextThresholds);
      saveLocalThresholds(nextThresholds);
      setStatusMessage('Sensor and actuator settings have been saved.');
      setStatusType('success');
      setCurrentPassword('');
      setPasswordPromptOpen(false);
    } catch (error) {
      setPasswordError(error.message || 'Unable to save threshold settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="info-box settings-full-box">
      <h4>Threshold Setting</h4>
      <p>These database settings control sensor status, simulation interval, actuator pulse duration, and actuator cooldown.</p>

      <div className="threshold-form">
        <div className="threshold-grid">
          <label>
            Moisture Min (%)
            <input
              type="number"
              value={thresholds.moistureMin}
              onChange={(e) => handleChange('moistureMin', e.target.value)}
              placeholder="50"
            />
          </label>

          <label>
            Gas Max (index)
            <input
              type="number"
              value={thresholds.gasMax}
              onChange={(e) => handleChange('gasMax', e.target.value)}
              placeholder="1200"
            />
          </label>

          <label>
            Spray Duration (seconds)
            <input
              type="number"
              value={thresholds.sprayDurationSeconds}
              onChange={(e) => handleChange('sprayDurationSeconds', e.target.value)}
              placeholder="5"
            />
          </label>

          <label>
            Fan Duration (seconds)
            <input
              type="number"
              value={thresholds.fanDurationSeconds}
              onChange={(e) => handleChange('fanDurationSeconds', e.target.value)}
              placeholder="5"
            />
          </label>

          <label>
            Spray Cooldown (seconds)
            <input
              type="number"
              value={thresholds.sprayCooldownSeconds}
              onChange={(e) => handleChange('sprayCooldownSeconds', e.target.value)}
              placeholder="30"
            />
          </label>

          <label>
            Fan Cooldown (seconds)
            <input
              type="number"
              value={thresholds.fanCooldownSeconds}
              onChange={(e) => handleChange('fanCooldownSeconds', e.target.value)}
              placeholder="30"
            />
          </label>

          <label className="threshold-reading-interval">
            Reading Interval (seconds)
            <input
              type="number"
              value={thresholds.readingIntervalSeconds}
              onChange={(e) => handleChange('readingIntervalSeconds', e.target.value)}
              placeholder="30"
            />
          </label>
        </div>

        <button className="save-button" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        {statusMessage && (
          <p className={`form-message ${statusType}`}>
            {statusMessage}
          </p>
        )}
      </div>

      {passwordPromptOpen && (
        <div className="threshold-password-overlay" role="dialog" aria-modal="true" aria-labelledby="threshold-password-title">
          <form className="threshold-password-card" onSubmit={confirmSave}>
            <h3 id="threshold-password-title">Confirm Threshold Change</h3>
            <p>Enter your current account password before saving preset threshold values.</p>
            {passwordError && <p className="form-message error">{passwordError}</p>}

            <label>
              Current password
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoFocus
              />
            </label>

            <div className="threshold-password-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setPasswordPromptOpen(false);
                  setCurrentPassword('');
                  setPasswordError('');
                }}
                disabled={saving}
              >
                Cancel
              </button>
              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? 'Verifying...' : 'Confirm Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default ThresholdSection;
