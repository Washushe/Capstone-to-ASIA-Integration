import { useMemo, useState, useEffect } from 'react';
import Layout from '../components/Layout.jsx';
import { getCurrentSensorData, saveLatestSensorSnapshot } from '../services/mockSensors.js';
import { getThresholdSettings, saveSensorReading } from '../services/api.js';

function Dashboard({ user, online }) {
  const [sensors, setSensors] = useState([]);
  const [thresholds, setThresholds] = useState({ moistureMin: 50, gasMax: 1500 });

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const settings = await getThresholdSettings();
        if (active) {
          setThresholds({
            moistureMin: settings.moistureMin ?? 50,
            gasMax: settings.gasMax ?? 1500,
          });
        }
      } catch {
        // Keep default thresholds if backend is unavailable
      }

      const initialData = getCurrentSensorData();
      if (active) {
        setSensors(initialData);
      }
      saveLatestSensorSnapshot(initialData);
      postSensorReading(initialData);
    }

    loadData();

    const interval = setInterval(() => {
      const updatedData = getCurrentSensorData();
      setSensors(updatedData);
      saveLatestSensorSnapshot(updatedData);
      postSensorReading(updatedData);
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
      return sensor.value > thresholds.gasMax ? 'High' : 'Normal';
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
              {sensor.value === null && <p className="placeholder-text">Awaiting sensor data</p>}
            </div>
          );
        })}
      </div>
    </Layout>
  );
}

export default Dashboard;
