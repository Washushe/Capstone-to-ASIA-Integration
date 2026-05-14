const API_BASE_URL = 'http://localhost:8080/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Request failed.');
  }

  return data;
}

// ==========================
// AUTHENTICATION
// ==========================

export async function loginUser(credentials) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  return data.user;
}

export async function registerUser(profile) {
  const data = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(profile),
  });

  return data.user;
}

// ==========================
// THRESHOLD SETTINGS
// ==========================

export async function getThresholdSettings() {
  return request('/settings/thresholds', {
    method: 'GET',
  });
}

export async function saveThresholdSettings(thresholds) {
  return request('/settings/thresholds', {
    method: 'PUT',
    body: JSON.stringify(thresholds),
  });
}

// ==========================
// SENSOR READINGS
// ==========================

export async function saveSensorReading(reading) {
  return request('/sensor-readings', {
    method: 'POST',
    body: JSON.stringify(reading),
  });
}

export async function getLatestSensorReading() {
  return request('/sensor-readings/latest', {
    method: 'GET',
  });
}

export async function getSensorReadings() {
  return request('/sensor-readings', {
    method: 'GET',
  });
}

// ==========================
// SENSOR SIMULATION
// ==========================

export async function getSensorSimulation(
  lastReading = [],
  moistureMin = 50,
  gasMax = 1200
) {
  return request('/sensor-simulation', {
    method: 'POST',
    body: JSON.stringify({
      lastReading,
      moistureMin,
      gasMax,
    }),
  });
}

export async function simulateNextSensorReading(lastReading, thresholds) {
  return request('/sensor-simulation', {
    method: 'POST',
    body: JSON.stringify({
      lastReading,
      moistureMin: thresholds.moistureMin,
      gasMax: thresholds.gasMax,
    }),
  });
}

export async function runSensorSimulationOnce() {
  return request('/sensor-simulation/run-once', {
    method: 'POST',
  });
}

// ==========================
// ACTUATOR STATUS
// ==========================

export async function getActuatorStatus() {
  return request('/actuator-status', {
    method: 'GET',
  });
}

export async function getActuatorLogs() {
  return request('/actuator-logs', {
    method: 'GET',
  });
}

// ==========================
// AI PREDICTION
// ==========================

export async function generateAIPrediction(batchId = 1, daysWindow = 21) {
  return request(`/predictions/generate/${batchId}`, {
    method: 'POST',
    body: JSON.stringify({
      daysWindow,
    }),
  });
}
