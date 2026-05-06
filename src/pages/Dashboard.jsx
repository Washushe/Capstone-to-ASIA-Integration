import { useMemo, useState } from 'react';

const initialSensors = [
  { label: 'Temperature', value: 35, unit: '°C', icon: '🌡', status: 'Optimal' },
  { label: 'Moisture', value: 48, unit: '%', icon: '💧', status: 'Optimal' },
  { label: 'Gas Level', value: 26, unit: 'PPM', icon: '🌫', status: 'Low' },
  { label: 'Humidity', value: 60, unit: '%', icon: '💨', status: 'Optimal' }
];

function getIndicator(value, label) {
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
  return 'Optimal';
}

function Dashboard({ user }) {
  const [sensors, setSensors] = useState(initialSensors);
  const [fanOn, setFanOn] = useState(true);
  const [sprayOn, setSprayOn] = useState(false);
  const [mixingMode, setMixingMode] = useState('Manual');
  const [online, setOnline] = useState(true);

  const systemStatus = useMemo(() => {
    const issues = sensors.filter((item) => getIndicator(item.value, item.label) !== 'Optimal');
    return issues.length > 0 ? 'Attention' : 'All systems nominal';
  }, [sensors]);

  const updateSensorValue = (index, delta) => {
    setSensors((current) =>
      current.map((item, idx) =>
        idx === index ? { ...item, value: Math.max(0, item.value + delta) } : item
      )
    );
  };

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand">Compost Accelerator</div>
        <nav>
          <a href="#dashboard" className="active">Dashboard</a>
          <a href="#monitoring">Monitoring</a>
          <a href="#controls">Controls</a>
          <a href="#ai-prediction">AI Prediction</a>
          <a href="#logs">Logs / History</a>
          <a href="#settings">Settings</a>
        </nav>
      </aside>

      <main className="dashboard-main">
        <header className="topbar">
          <div>
            <div className="topbar-label">IoT-Based Compost Accelerator</div>
            <div className="topbar-subtext">AI Prediction, Monitoring, and Automated Spray & Fan Control</div>
          </div>
          <div className="topbar-right">
            <div className={`status-chip ${online ? 'online' : 'offline'}`}>
              {online ? '🟢 Online' : '🔴 Offline'}
            </div>
            <div className="profile-chip">{user?.name || 'User'}</div>
          </div>
        </header>

        <section className="dashboard-content" id="dashboard">
          <div className="section-header">
            <div>
              <h2>Dashboard</h2>
              <p>{systemStatus}</p>
            </div>
            <button className="secondary-button" onClick={() => setOnline((prev) => !prev)}>
              Toggle Network
            </button>
          </div>

          <div className="cards-grid">
            {sensors.map((sensor, index) => {
              const indicator = getIndicator(sensor.value, sensor.label);
              return (
                <div key={sensor.label} className="status-card">
                  <div className="card-icon">{sensor.icon}</div>
                  <h3>{sensor.label}</h3>
                  <div className="card-value">
                    {sensor.value}
                    <span>{sensor.unit}</span>
                  </div>
                  <div className={`card-status ${indicator.toLowerCase()}`}>{indicator}</div>
                  <div className="card-actions">
                    <button onClick={() => updateSensorValue(index, -1)}>-</button>
                    <button onClick={() => updateSensorValue(index, 1)}>+</button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="control-panel" id="monitoring">
            <div className="panel-header">
              <h3>Device Status Panel</h3>
              <p>Automation logic: fan responds to gas, spray responds to moisture.</p>
            </div>

            <div className="device-cards">
              <div className="device-card">
                <span>Fan</span>
                <strong>{fanOn ? 'ON' : 'OFF'}</strong>
                <button onClick={() => setFanOn((prev) => !prev)}>{fanOn ? 'Turn off' : 'Turn on'}</button>
              </div>
              <div className="device-card">
                <span>Spray</span>
                <strong>{sprayOn ? 'ON' : 'OFF'}</strong>
                <button onClick={() => setSprayOn((prev) => !prev)}>{sprayOn ? 'Turn off' : 'Turn on'}</button>
              </div>
              <div className="device-card">
                <span>Mixing</span>
                <strong>{mixingMode}</strong>
                <button onClick={() => setMixingMode((prev) => (prev === 'Manual' ? 'Auto' : 'Manual'))}>
                  Switch to {mixingMode === 'Manual' ? 'Auto' : 'Manual'}
                </button>
              </div>
            </div>
          </div>

          <div className="info-panels">
            <div className="info-box" id="ai-prediction">
              <h4>AI Prediction</h4>
              <p>Estimated compost readiness in 36 hours if ambient conditions remain stable.</p>
            </div>
            <div className="info-box" id="logs">
              <h4>Logs / History</h4>
              <p>Recent events: fan activated, moisture spray schedule updated, gas threshold reached.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
