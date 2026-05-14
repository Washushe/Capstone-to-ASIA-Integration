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

const GAS_LOW_THRESHOLD = 800;
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

export function getSensorStatus(sensorId, value, thresholds = null) {
  const currentThresholds = thresholds || getThresholds();

  switch (sensorId) {
    case 'moisture':
      if (value < currentThresholds.moistureMin) return 'LOW';
      if (value > 70) return 'HIGH';
      return 'OPTIMAL';
    case 'gas':
      if (value < GAS_LOW_THRESHOLD) return 'LOW';
      if (value > currentThresholds.gasMax) return 'HIGH';
      return 'OPTIMAL';
    case 'temperature':
      if (value < 25) return 'LOW';
      if (value > 35) return 'HIGH';
      return 'OPTIMAL';
    case 'humidity':
      if (value < 45) return 'LOW';
      if (value > 75) return 'HIGH';
      return 'OPTIMAL';
    default:
      return 'OPTIMAL';
  }
}

function simulateSensorValue(sensorId, lastValue, fanActive, pumpActive, thresholds) {
  const noise = (Math.random() - 0.5) * 2;
  const abnormalSpike = Math.random() < 0.12;

  switch (sensorId) {
    case 'gas': {
      const sourceValue = lastValue;
      if (sourceValue > thresholds.gasMax) {
        return sourceValue - (4 + Math.random() * 5) + noise + (abnormalSpike ? -10 : 0);
      }
      if (sourceValue < GAS_LOW_THRESHOLD) {
        return sourceValue + (5 + Math.random() * 6) + noise + (abnormalSpike ? 10 : 0);
      }
      const drift = (Math.random() - 0.5) * 20;
      const bounce = abnormalSpike ? (Math.random() < 0.5 ? -35 : 35) : 0;
      return sourceValue + drift + bounce + (fanActive ? -2 : 0);
    }

    case 'temperature': {
      const sourceValue = lastValue;
      if (sourceValue > 35) {
        return sourceValue - (1 + Math.random() * 1.5) + noise;
      }
      if (sourceValue < 25) {
        return sourceValue + (0.8 + Math.random() * 1.2) + noise;
      }
      const drift = (Math.random() - 0.5) * 1.8;
      return sourceValue + drift + (abnormalSpike ? (Math.random() < 0.5 ? -2.5 : 2.5) : 0);
    }

    case 'moisture': {
      const sourceValue = lastValue;
      if (sourceValue < thresholds.moistureMin) {
        return sourceValue + (3 + Math.random() * 3) + noise + (pumpActive ? 1.5 : 0);
      }
      if (sourceValue > 75) {
        return sourceValue - (1.5 + Math.random() * 3) + noise;
      }
      const drift = (Math.random() - 0.5) * 6;
      return sourceValue + drift + (abnormalSpike ? (Math.random() < 0.5 ? -10 : 10) : 0);
    }

    case 'humidity': {
      const sourceValue = lastValue;
      if (sourceValue < 45) {
        return sourceValue + (1 + Math.random() * 2.5) + noise;
      }
      if (sourceValue > 75) {
        return sourceValue - (1 + Math.random() * 2.5) + noise;
      }
      const drift = (Math.random() - 0.5) * 2;
      return sourceValue + drift + (abnormalSpike ? (Math.random() < 0.5 ? -4 : 4) : 0);
    }

    default:
      return lastValue + noise;
  }
}

export function getCurrentSensorData(lastReading = null, thresholds = null) {
  const thresholdSettings = thresholds || getThresholds();
  const previousReadings = Array.isArray(lastReading) ? lastReading : [];
  const actuatorState = getActuatorState(previousReadings, thresholdSettings);

  return mockSensors.map((sensor) => {
    const lastSensor = previousReadings.find((entry) => entry.id === sensor.id);
    const baseValue = lastSensor ? lastSensor.value : sensor.value;
    let value = simulateSensorValue(
      sensor.id,
      baseValue,
      actuatorState.fanActive,
      actuatorState.pumpActive,
      thresholdSettings
    );

    value = clamp(value, sensor.optimalRange.min - 20, sensor.optimalRange.max + 60);
    value = Number(value.toFixed(1));

    const status = getSensorStatus(sensor.id, value, thresholdSettings);
    const isGasActive = sensor.id === 'gas' && status === 'HIGH';
    const isTemperatureActive = sensor.id === 'temperature' && status === 'HIGH';
    const isMoistureActive = sensor.id === 'moisture' && status === 'LOW';

    return {
      ...sensor,
      value,
      status,
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
