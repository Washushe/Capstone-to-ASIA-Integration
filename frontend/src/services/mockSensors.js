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

const defaultThresholds = {
  moistureMin: 50,
  gasMax: 1500,
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getActuatorState(lastReading, thresholds) {
  if (!Array.isArray(lastReading)) {
    return { fanActive: false, pumpActive: false };
  }

  const gas = lastReading.find((entry) => entry.id === 'gas');
  const temp = lastReading.find((entry) => entry.id === 'temperature');
  const moisture = lastReading.find((entry) => entry.id === 'moisture');

  return {
    fanActive: Boolean(gas?.value > thresholds.gasMax || temp?.value > 35),
    pumpActive: Boolean(moisture?.value < thresholds.moistureMin),
  };
}

export function getCurrentSensorData(lastReading = null, thresholds = null) {
  const thresholdSettings = thresholds || getThresholds();
  const previousReadings = Array.isArray(lastReading) ? lastReading : [];
  const actuatorState = getActuatorState(previousReadings, thresholdSettings);

  return mockSensors.map((sensor) => {
    const lastSensor = previousReadings.find((entry) => entry.id === sensor.id);
    const noise = (Math.random() - 0.5) * 2;
    let value = lastSensor ? lastSensor.value + noise : sensor.value + noise;

    if (sensor.id === 'gas' && actuatorState.fanActive && lastSensor) {
      value = lastSensor.value - 80 + (Math.random() * 10 - 5);
    }

    if (sensor.id === 'temperature' && actuatorState.fanActive && lastSensor && lastSensor.value > 35) {
      value = lastSensor.value - 2 + (Math.random() * 2 - 1);
    }

    if (sensor.id === 'moisture' && actuatorState.pumpActive && lastSensor) {
      value = lastSensor.value + 6 + (Math.random() * 2 - 1);
    }

    value = clamp(value, sensor.optimalRange.min - 20, sensor.optimalRange.max + 60);
    value = Number(value.toFixed(1));

    const isGasActive = sensor.id === 'gas' && value > thresholdSettings.gasMax;
    const isTemperatureActive = sensor.id === 'temperature' && value > 35;
    const isMoistureActive = sensor.id === 'moisture' && value < thresholdSettings.moistureMin;

    return {
      ...sensor,
      value,
      actuatorActive: isGasActive || isTemperatureActive || isMoistureActive,
      actuatorName:
        isGasActive || isTemperatureActive ? 'Fan' : isMoistureActive ? 'Water Pump' : null,
    };
  });
}

export function getThresholds() {
  const stored = localStorage.getItem('compostThresholds');
  if (stored) {
    return JSON.parse(stored);
  }
  return defaultThresholds;
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
