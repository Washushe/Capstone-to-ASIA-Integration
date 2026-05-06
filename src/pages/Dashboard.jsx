import { useMemo, useState } from 'react';
import Layout from '../components/Layout.jsx';

const initialSensors = [
  { label: 'Temperature', value: null, unit: '°C', icon: '🌡' },
  { label: 'Moisture', value: null, unit: '%', icon: '💧' },
  { label: 'Gas Level', value: null, unit: 'PPM', icon: '🌫' },
  { label: 'Humidity', value: null, unit: '%', icon: '💨' }
];

function getIndicator(value, label) {
  if (value === null || value === undefined) return 'Unknown';
  if (label === 'Temperature') {
    if (value > 42) return 'High';
    if (value < 30) return 'Low';
    return 'Optimal';
  }
  if (label === 'Moisture') {
    if (value > 70) return 'High';
    if (value < 40) return 'Low';
    return 'Optimal';
  }
  if (label === 'Gas Level') {
    if (value > 40) return 'High';
    if (value < 20) return 'Low';
    return 'Optimal';
  }
  if (label === 'Humidity') {
    if (value > 75) return 'High';
    if (value < 45) return 'Low';
    return 'Optimal';
  }
  return 'Unknown';
}

function Dashboard({ user, online }) {
  const [sensors] = useState(initialSensors);

  const systemStatus = useMemo(() => {
    const loaded = sensors.some((item) => item.value !== null);
    return loaded ? 'Live sensor data is incoming' : 'Waiting for sensor data';
  }, [sensors]);

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
          const indicator = getIndicator(sensor.value, sensor.label);
          return (
            <div key={sensor.label} className="status-card">
              <div className="card-icon">{sensor.icon}</div>
              <h3>{sensor.label}</h3>
              <div className="card-value">
                {sensor.value !== null ? sensor.value : '--'}
                <span>{sensor.unit}</span>
              </div>
              <div className={`card-status ${indicator.toLowerCase()}`}>{indicator}</div>
              {sensor.value === null && <p className="placeholder-text">Awaiting sensor data</p>}
            </div>
          );
        })}
      </div>
    </Layout>
  );
}

export default Dashboard;
