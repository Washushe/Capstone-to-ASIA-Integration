// Mock sensor data for the compost system
// This simulates real sensor readings that would come from IoT devices
export const mockSensors = [
  {
    id: 'temperature',
    name: 'Temperature',
    value: 28.5,
    unit: '°C',
    optimalRange: { min: 25, max: 35 },
  },
  {
    id: 'moisture',
    name: 'Moisture',
    value: 65,
    unit: '%',
    optimalRange: { min: 50, max: 70 },
  },
  {
    id: 'gas',
    name: 'Gas Concentration',
    value: 1200,
    unit: 'PPM',
    optimalRange: { min: 800, max: 1500 },
  },
  {
    id: 'humidity',
    name: 'Humidity',
    value: 55,
    unit: '%',
    optimalRange: { min: 45, max: 75 },
  },
];

export function getCurrentSensorData() {
  return mockSensors.map((sensor) => ({
    ...sensor,
    value: Number((sensor.value + (Math.random() - 0.5) * 2).toFixed(1)),
  }));
}

export function getThresholds() {
  const stored = localStorage.getItem('compostThresholds');
  if (stored) {
    return JSON.parse(stored);
  }
  return {
    moistureMin: 50,
    gasMax: 1500,
  };
}

export function saveThresholds(thresholds) {
  localStorage.setItem('compostThresholds', JSON.stringify(thresholds));
}

export function saveLatestSensorSnapshot(snapshot) {
  localStorage.setItem('latestSensorSnapshot', JSON.stringify(snapshot));
}

export function getLatestSensorSnapshot() {
  const stored = localStorage.getItem('latestSensorSnapshot');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function getStatus(value, min, max) {
  if (value < min) return 'low';
  if (value > max) return 'high';
  return 'optimal';
}
