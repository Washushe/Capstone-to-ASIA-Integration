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
    optimalRange: { min: 800, max: 1200 },
  },
  {
    id: 'humidity',
    name: 'Humidity',
    value: 55,
    unit: '%',
    optimalRange: { min: 45, max: 75 },
  },
];

const GAS_HIGH_THRESHOLD = 1200;

const defaultThresholds = {
  moistureMin: 50,
  gasMax: GAS_HIGH_THRESHOLD,
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
    const baseValue = lastSensor ? lastSensor.value : sensor.value;
    const noise = (Math.random() - 0.5) * 2;
    let value = baseValue;

    if (sensor.id === 'gas') {
      if (lastSensor && actuatorState.fanActive && lastSensor.value > thresholdSettings.gasMax) {
        // Reduce to optimal range when fan is active
        value = thresholdSettings.gasMax - 50 + ((Math.random() - 0.5) * 20);
      } else if (lastSensor && lastSensor.value > thresholdSettings.gasMax) {
        // Continue decreasing when high
        value = lastSensor.value - (30 + Math.random() * 10) + noise;
      } else if (lastSensor && lastSensor.value < 800) {
        // Increase when low
        value = lastSensor.value + (Math.random() * 50) + noise;
      } else {
        // Normal fluctuation in optimal range
        value = baseValue + (Math.random() - 0.5) * 100 + noise;
      }
    } else if (sensor.id === 'temperature') {
      // Keep temperature in optimal range (25-35°C)
      if (lastSensor && actuatorState.fanActive && lastSensor.value > 35) {
        value = lastSensor.value - (1.5 + Math.random() * 1.5) + noise;
      } else if (lastSensor && lastSensor.value > 35) {
        value = lastSensor.value - (0.7 + Math.random() * 0.8) + noise;
      } else if (lastSensor && lastSensor.value < 25) {
        value = lastSensor.value + (Math.random() * 2) + noise;
      } else {
        value = baseValue + noise;
      }
    } else if (sensor.id === 'moisture') {
      if (lastSensor && actuatorState.pumpActive && lastSensor.value < thresholdSettings.moistureMin) {
        // Increase to optimal range when pump is active
        value = thresholdSettings.moistureMin + 10 + ((Math.random() - 0.5) * 5);
      } else if (lastSensor && lastSensor.value < thresholdSettings.moistureMin) {
        // Continue increasing when low
        value = lastSensor.value + (3 + Math.random() * 2) + noise;
      } else if (lastSensor && lastSensor.value > 75) {
        // Decrease when high
        value = lastSensor.value - (Math.random() * 5) + noise;
      } else {
        // Normal fluctuation in optimal range
        value = baseValue + (Math.random() - 0.5) * 10 + noise;
      }
    } else if (sensor.id === 'humidity') {
      // Keep humidity in optimal range (45-75%)
      if (lastSensor && actuatorState.fanActive) {
        value = lastSensor.value - (0.5 + Math.random() * 1) + noise;
      } else if (lastSensor && lastSensor.value > 75) {
        value = lastSensor.value - (Math.random() * 2) + noise;
      } else if (lastSensor && lastSensor.value < 45) {
        value = lastSensor.value + (Math.random() * 2) + noise;
      } else {
        value = baseValue + noise;
      }
    } else {
      value = baseValue + noise;
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
