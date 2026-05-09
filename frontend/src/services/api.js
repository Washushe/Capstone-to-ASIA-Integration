const API_BASE_URL = 'http://localhost:8080/api';

async function request(path, options) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Request failed.');
  }

  return data;
}

export async function loginUser(credentials) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  return data.user;
}

export async function getThresholdSettings() {
  return request('/settings/thresholds', { method: 'GET' });
}

export async function saveThresholdSettings(thresholds) {
  return request('/settings/thresholds', {
    method: 'PUT',
    body: JSON.stringify(thresholds),
  });
}

export async function saveSensorReading(reading) {
  return request('/sensor-readings', {
    method: 'POST',
    body: JSON.stringify(reading),
  });
}

export async function getLatestSensorReading() {
  return request('/sensor-readings/latest', { method: 'GET' });
}

export async function getSensorReadings() {
  return request('/sensor-readings', { method: 'GET' });
}

export async function getAIPredictions(selectedSensors) {
  return request('/ai/predict', {
    method: 'POST',
    body: JSON.stringify({
      sensors: selectedSensors,
      lookback: 20,
    }),
  });
}

export async function registerUser(profile) {
  const data = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(profile),
  });

  return data.user;
}