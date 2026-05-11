import { useMemo, useRef, useState, useEffect } from 'react';
import Layout from '../components/Layout.jsx';
import { getThresholdSettings, saveSensorReading, getSensorSimulation, getActuatorStatus, getLatestSensorReading } from '../services/api.js';
import { getCurrentSensorData, getThresholds } from '../services/mockSensors.js';

const GAS_HIGH_THRESHOLD = 1200;

function Dashboard({ user, online }) {
  const [sensors, setSensors] = useState([]);
  const sensorsRef = useRef([]);
  const [thresholds, setThresholds] = useState({ moistureMin: 50, gasMax: GAS_HIGH_THRESHOLD });
  const thresholdsRef = useRef(thresholds);

  useEffect(() => {
    thresholdsRef.current = thresholds;
  }, [thresholds]);

  useEffect(() => {
    sensorsRef.current = sensors;
  }, [sensors]);

  useEffect(() => {
    let active = true;

    async function loadData() {
      let settings = { moistureMin: 50, gasMax: GAS_HIGH_THRESHOLD };
      try {
        const apiSettings = await getThresholdSettings();
        settings = {
          moistureMin: apiSettings.moistureMin ?? 50,
          gasMax: GAS_HIGH_THRESHOLD,
        };
        if (active) {
          setThresholds(settings);
        }
      } catch {
        // Keep default thresholds if backend is unavailable
      }

      try {
        const latestReading = await getLatestSensorReading();
        if (latestReading && latestReading.temperatureC != null) {
          const sensorData = [
            {
              id: 'temperature',
              name: 'Temperature',
              value: latestReading.temperatureC,
              unit: '°C',
              actuatorActive: latestReading.temperatureC > 35,
              actuatorName: latestReading.temperatureC > 35 ? 'Fan' : null,
            },
            {
              id: 'moisture',
              name: 'Moisture',
              value: latestReading.moistureLevel,
              unit: '%',
              actuatorActive: latestReading.moistureLevel < settings.moistureMin,
              actuatorName: latestReading.moistureLevel < settings.moistureMin ? 'Water Pump' : null,
            },
            {
              id: 'gas',
              name: 'Gas Concentration',
              value: latestReading.gasLevel,
              unit: 'PPM',
              actuatorActive: latestReading.gasLevel > GAS_HIGH_THRESHOLD,
              actuatorName: latestReading.gasLevel > GAS_HIGH_THRESHOLD ? 'Fan' : null,
            },
            {
              id: 'humidity',
              name: 'Humidity',
              value: latestReading.humidityLevel,
              unit: '%',
              actuatorActive: false,
              actuatorName: null,
            },
          ];

          if (active) {
            setSensors(sensorData);
          }
        } else {
          const simulationResponse = await getSensorSimulation([], settings.moistureMin, GAS_HIGH_THRESHOLD);
          const actuatorStatus = await getActuatorStatus();
          const sensorData = simulationResponse.sensors.map(sensor => ({
            ...sensor,
            actuatorActive: sensor.id === 'gas' || sensor.id === 'temperature'
              ? actuatorStatus.fanActive
              : sensor.id === 'moisture'
                ? actuatorStatus.waterPumpActive
                : false,
            actuatorName: sensor.id === 'gas' || sensor.id === 'temperature'
              ? 'Fan'
              : sensor.id === 'moisture'
                ? 'Water Pump'
                : null,
          }));

          if (active) {
            setSensors(sensorData);
          }
        }
      } catch (error) {
        console.error('Failed to load sensor data from backend, using mock data:', error);
        // Fallback to mock data when backend is not available
        const mockSensorData = getCurrentSensorData([], { moistureMin: settings.moistureMin, gasMax: GAS_HIGH_THRESHOLD });
        if (active) {
          setSensors(mockSensorData);
        }
      }
    }

    loadData();

    const interval = setInterval(async () => {
      try {
        const simulationResponse = await getSensorSimulation(sensorsRef.current, thresholdsRef.current.moistureMin, GAS_HIGH_THRESHOLD);
        const actuatorStatus = await getActuatorStatus();
        const updatedData = simulationResponse.sensors.map(sensor => ({
          ...sensor,
          actuatorActive: sensor.id === 'gas' || sensor.id === 'temperature'
            ? actuatorStatus.fanActive
            : sensor.id === 'moisture'
              ? actuatorStatus.waterPumpActive
              : false,
          actuatorName: sensor.id === 'gas' || sensor.id === 'temperature'
            ? 'Fan'
            : sensor.id === 'moisture'
              ? 'Water Pump'
              : null,
        }));
        postSensorReading(updatedData);
        setSensors(updatedData);
      } catch (error) {
        console.error('Failed to simulate sensor reading from backend, using mock data:', error);
        // Fallback to mock data when backend is not available
        const mockSensorData = getCurrentSensorData(sensorsRef.current, { moistureMin: thresholdsRef.current.moistureMin, gasMax: GAS_HIGH_THRESHOLD });
        setSensors(mockSensorData);
        postSensorReading(mockSensorData);
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

  const postSensorReading = async (sensorData) => {
    const values = Object.fromEntries(sensorData.map((sensor) => [sensor.id, sensor]));

    try {
      await saveSensorReading({
        moistureLevel: values.moisture?.value ?? 0,
        gasLevel: values.gas?.value ?? 0,
        temperatureC: values.temperature?.value ?? 0,
        humidityLevel: values.humidity?.value ?? 0,
      });
    } catch {
      // Ignore backend failures for live sensor persistence
    }
  };

  const getStatus = (sensor) => {
    if (sensor.id === 'moisture') {
      return sensor.value < thresholds.moistureMin ? 'Low' : 'Optimal';
    }
    if (sensor.id === 'gas') {
      return sensor.value > GAS_HIGH_THRESHOLD ? 'High' : 'Optimal';
    }
    if (sensor.id === 'temperature') {
      if (sensor.value > 35) return 'High';
      if (sensor.value < 25) return 'Low';
      return 'Optimal';
    }
    if (sensor.id === 'humidity') {
      if (sensor.value > 75) return 'High';
      if (sensor.value < 45) return 'Low';
      return 'Normal';
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
