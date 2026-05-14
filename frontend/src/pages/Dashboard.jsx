import { useMemo, useRef, useState, useEffect } from 'react';
import Layout from '../components/Layout.jsx';
import { getThresholdSettings, getSensorSimulation, getActuatorStatus, getLatestSensorReading } from '../services/api.js';
import { getCurrentSensorData } from '../services/mockSensors.js';

const GAS_HIGH_THRESHOLD = 1200;
const DASHBOARD_SENSORS_KEY = 'dashboardSensors';
const DASHBOARD_THRESHOLDS_KEY = 'dashboardThresholds';

const loadStoredSensors = () => {
  try {
    const saved = localStorage.getItem(DASHBOARD_SENSORS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const loadStoredThresholds = () => {
  try {
    const saved = localStorage.getItem(DASHBOARD_THRESHOLDS_KEY);
    return saved
      ? JSON.parse(saved)
      : { moistureMin: 50, gasMax: GAS_HIGH_THRESHOLD };
  } catch {
    return { moistureMin: 50, gasMax: GAS_HIGH_THRESHOLD };
  }
};

const buildSensorCards = (reading, settings) => [
  {
    id: 'temperature',
    name: 'Temperature',
    value: reading.temperatureC,
    unit: '°C',
    actuatorActive: reading.temperatureC > 35,
    actuatorName: reading.temperatureC > 35 ? 'Fan' : null,
  },
  {
    id: 'moisture',
    name: 'Moisture',
    value: reading.moistureLevel,
    unit: '%',
    actuatorActive: reading.moistureLevel < settings.moistureMin,
    actuatorName: reading.moistureLevel < settings.moistureMin ? 'Water Pump' : null,
  },
  {
    id: 'gas',
    name: 'Gas Concentration',
    value: reading.gasLevel,
    unit: 'PPM',
    actuatorActive: reading.gasLevel > settings.gasMax,
    actuatorName: reading.gasLevel > settings.gasMax ? 'Fan' : null,
  },
  {
    id: 'humidity',
    name: 'Humidity',
    value: reading.humidityLevel,
    unit: '%',
    actuatorActive: false,
    actuatorName: null,
  },
];

function Dashboard({ user, online }) {
  const [sensors, setSensors] = useState(() => loadStoredSensors());
  const [thresholds, setThresholds] = useState(() => loadStoredThresholds());
  const sensorsRef = useRef(sensors);
  const thresholdsRef = useRef(thresholds);

  useEffect(() => {
    sensorsRef.current = sensors;
    localStorage.setItem(DASHBOARD_SENSORS_KEY, JSON.stringify(sensors));
  }, [sensors]);

  useEffect(() => {
    thresholdsRef.current = thresholds;
    localStorage.setItem(DASHBOARD_THRESHOLDS_KEY, JSON.stringify(thresholds));
  }, [thresholds]);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      let settings = { moistureMin: 50, gasMax: GAS_HIGH_THRESHOLD };

      try {
        const apiSettings = await getThresholdSettings();
        settings = {
          moistureMin: apiSettings.moistureMin ?? 50,
          gasMax: apiSettings.gasMax ?? GAS_HIGH_THRESHOLD,
        };

        if (active) {
          setThresholds(settings);
        }
      } catch {
        // Keep the last known thresholds when backend cannot be reached.
      }

      try {
        const latestReading = await getLatestSensorReading();

        if (latestReading && latestReading.temperatureC != null) {
          const sensorData = buildSensorCards(latestReading, settings);

          if (active) {
            setSensors(sensorData);
          }
          return;
        }

        const simulationResponse = await getSensorSimulation(
          sensorsRef.current,
          settings.moistureMin,
          settings.gasMax
        );
        const actuatorStatus = await getActuatorStatus();

        if (active) {
          setSensors(
            simulationResponse.sensors.map((sensor) => ({
              ...sensor,
              actuatorActive:
                sensor.id === 'gas' || sensor.id === 'temperature'
                  ? actuatorStatus.fanActive
                  : sensor.id === 'moisture'
                  ? actuatorStatus.waterPumpActive
                  : false,
              actuatorName:
                sensor.id === 'gas' || sensor.id === 'temperature'
                  ? 'Fan'
                  : sensor.id === 'moisture'
                  ? 'Water Pump'
                  : null,
            }))
          );
        }
      } catch (error) {
        console.error('Failed to load sensor data from backend:', error);

        if (!sensorsRef.current.length && active) {
          const mockSensorData = getCurrentSensorData(sensorsRef.current, {
            moistureMin: settings.moistureMin,
            gasMax: settings.gasMax,
          });
          setSensors(mockSensorData);
        }
      }
    };

    loadData();

    const interval = setInterval(async () => {
      try {
        const latestReading = await getLatestSensorReading();

        if (latestReading && latestReading.temperatureC != null) {
          const updatedData = buildSensorCards(latestReading, thresholdsRef.current);
          if (active) {
            setSensors(updatedData);
          }
          return;
        }

        if (!sensorsRef.current.length) {
          const simulationResponse = await getSensorSimulation(
            sensorsRef.current,
            thresholdsRef.current.moistureMin,
            thresholdsRef.current.gasMax
          );
          const actuatorStatus = await getActuatorStatus();

          if (active) {
            setSensors(
              simulationResponse.sensors.map((sensor) => ({
                ...sensor,
                actuatorActive:
                  sensor.id === 'gas' || sensor.id === 'temperature'
                    ? actuatorStatus.fanActive
                    : sensor.id === 'moisture'
                    ? actuatorStatus.waterPumpActive
                    : false,
                actuatorName:
                  sensor.id === 'gas' || sensor.id === 'temperature'
                    ? 'Fan'
                    : sensor.id === 'moisture'
                    ? 'Water Pump'
                    : null,
              }))
            );
          }
        }
      } catch (error) {
        console.error('Background polling failed for sensor data:', error);
      }
    }, 60000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const systemStatus = useMemo(() => {
    return sensors.length > 0 ? 'Live sensor data is incoming' : 'Waiting for sensor data';
  }, [sensors]);

  const getStatus = (sensor) => {
    if (sensor.id === 'moisture') {
      if (sensor.value < thresholds.moistureMin) return 'Low';
      if (sensor.value > 75) return 'High';
      return 'Optimal';
    }
    if (sensor.id === 'gas') {
      if (sensor.value < 800) return 'Low';
      if (sensor.value > thresholds.gasMax) return 'High';
      return 'Optimal';
    }
    if (sensor.id === 'temperature') {
      if (sensor.value > 35) return 'High';
      if (sensor.value < 25) return 'Low';
      return 'Optimal';
    }
    if (sensor.id === 'humidity') {
      if (sensor.value > 75) return 'High';
      if (sensor.value < 45) return 'Low';
      return 'Optimal';
    }
    return 'Unknown';
  };

  return (
    <Layout
      user={user}
      title="Dashboard"
      subtitle="Sensor Monitoring and Live System Status"
      online={online}
    >
      <div className="section-header">
        <div>
          <h2>Dashboard</h2>
          <p>{systemStatus}</p>
        </div>
      </div>

      <div className="cards-grid">
        {sensors.map((sensor) => {
          const status = getStatus(sensor);
          return (
            <div key={sensor.id} className={`status-card ${status.toLowerCase()}`}>
              <div className="card-icon">
                {sensor.id === 'temperature' && '🌡'}
                {sensor.id === 'moisture' && '💧'}
                {sensor.id === 'gas' && '🌫'}
                {sensor.id === 'humidity' && '💨'}
              </div>
              <h3>{sensor.name}</h3>
              <div className="card-value">
                {sensor.value !== null ? sensor.value.toFixed(1) : '--'}
                <span>{sensor.unit}</span>
              </div>
              <div className={`card-status ${status.toLowerCase()}`}>
                {status}
              </div>
              <div className="card-description">
                {sensor.id === 'gas' && 'Fan is active when gas hits high'}
                {sensor.id === 'moisture' && 'Spray is active when moisture hits low'}
                {sensor.id === 'temperature' && 'Fan is active when temperature exceeds 35°C'}
                {sensor.id === 'humidity' && 'Humidity monitoring'}
              </div>
              {sensor.actuatorActive && sensor.actuatorName && (
                <div className="card-action">{sensor.actuatorName} active</div>
              )}
              {sensor.value === null && <p className="placeholder-text">Awaiting sensor data</p>}
            </div>
          );
        })}
      </div>
    </Layout>
  );
}

export default Dashboard;
