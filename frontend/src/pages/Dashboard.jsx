import { useMemo, useRef, useState, useEffect } from 'react';
import Layout from '../components/Layout.jsx';
import {
  getActuatorStatus,
  getLatestSensorReading,
  getThresholdSettings,
} from '../services/api.js';

const GAS_HIGH_THRESHOLD = 1200;
const DASHBOARD_POLL_INTERVAL_MS = 30000;
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

const buildSensorCards = (reading) => [
  {
    id: 'temperature',
    name: 'Temperature',
    value: reading.temperatureC,
    unit: '°C',
    description: 'Chamber reading saved for monitoring and prediction',
  },
  {
    id: 'moisture',
    name: 'Moisture',
    value: reading.moistureLevel,
    unit: '%',
    description: 'Water spray is triggered only below the moisture minimum',
  },
  {
    id: 'gas',
    name: 'Gas Level',
    value: reading.gasLevel,
    unit: 'index',
    description: 'Fan is triggered only above the gas maximum',
  },
  {
    id: 'humidity',
    name: 'Humidity',
    value: reading.humidityLevel,
    unit: '%',
    description: 'Humidity is saved for monitoring and prediction',
  },
];

const formatDateTime = (value) => {
  if (!value) return 'No data yet';
  return new Date(value).toLocaleString();
};

function Dashboard({ user, online }) {
  const [sensors, setSensors] = useState(() => loadStoredSensors());
  const [thresholds, setThresholds] = useState(() => loadStoredThresholds());
  const [actuatorStatus, setActuatorStatus] = useState(null);
  const [latestReadingAt, setLatestReadingAt] = useState(null);
  const [dataState, setDataState] = useState('loading');
  const thresholdsRef = useRef(thresholds);

  useEffect(() => {
    localStorage.setItem(DASHBOARD_SENSORS_KEY, JSON.stringify(sensors));
  }, [sensors]);

  useEffect(() => {
    thresholdsRef.current = thresholds;
    localStorage.setItem(DASHBOARD_THRESHOLDS_KEY, JSON.stringify(thresholds));
  }, [thresholds]);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      let settings = thresholdsRef.current;

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
        // Keep cached thresholds while the backend is unavailable.
      }

      try {
        const [latestReading, latestActuatorStatus] = await Promise.all([
          getLatestSensorReading(),
          getActuatorStatus(),
        ]);

        if (!active) return;

        setActuatorStatus(latestActuatorStatus);

        if (latestReading && latestReading.temperatureC != null) {
          setSensors(buildSensorCards(latestReading));
          setLatestReadingAt(latestReading.createdAt);
          setDataState('live');
          return;
        }

        setSensors([]);
        setLatestReadingAt(null);
        setDataState('waiting');
      } catch (error) {
        console.error('Failed to load dashboard data from backend:', error);

        if (active) {
          setDataState('offline');
        }
      }
    };

    loadData();

    const interval = setInterval(loadData, DASHBOARD_POLL_INTERVAL_MS);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const systemStatus = useMemo(() => {
    if (dataState === 'live') {
      return 'Live database readings are active';
    }

    if (dataState === 'offline') {
      return sensors.length > 0
        ? 'Backend unavailable. Showing last cached database reading'
        : 'Backend unavailable. Waiting for database sensor data';
    }

    return sensors.length > 0
      ? 'Showing last cached database reading'
      : 'Waiting for database sensor data';
  }, [dataState, sensors.length]);

  const getStatus = (sensor) => {
    if (sensor.id === 'moisture') {
      if (sensor.value < thresholds.moistureMin) return 'Low';
      if (sensor.value > 70) return 'High';
      return 'Optimal';
    }
    if (sensor.id === 'gas') {
      if (sensor.value < 800) return 'Low';
      if (sensor.value > thresholds.gasMax) return 'High';
      return 'Optimal';
    }
    if (sensor.id === 'temperature') {
      if (sensor.value > 50) return 'High';
      if (sensor.value < 30) return 'Low';
      return 'Optimal';
    }
    if (sensor.id === 'humidity') {
      if (sensor.value > 70) return 'High';
      if (sensor.value < 40) return 'Low';
      return 'Optimal';
    }
    return 'Unknown';
  };

  const getRuntimeStatus = (actuatorType) => {
    return actuatorStatus?.actuators?.find(
      (actuator) => actuator.actuatorType === actuatorType
    );
  };

  const getActuatorLabel = (runtimeStatus, active) => {
    if (active) return 'ON';

    const cooldownUntil = runtimeStatus?.cooldownUntil
      ? new Date(runtimeStatus.cooldownUntil)
      : null;

    if (cooldownUntil && cooldownUntil > new Date()) {
      return `Cooldown until ${cooldownUntil.toLocaleTimeString()}`;
    }

    return 'OFF';
  };

  const fanRuntime = getRuntimeStatus('FAN');
  const sprayRuntime = getRuntimeStatus('WATER_SPRAY');
  const latestActivity = actuatorStatus?.latestActivity;

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
        <div className="timestamp-chip">
          Latest reading: {formatDateTime(latestReadingAt)}
        </div>
      </div>

      <div className="cards-grid">
        {sensors.map((sensor) => {
          const status = getStatus(sensor);
          return (
            <div key={sensor.id} className={`status-card ${status.toLowerCase()}`}>
              <div className="card-icon">
                {sensor.id === 'temperature' && 'Temp'}
                {sensor.id === 'moisture' && 'H2O'}
                {sensor.id === 'gas' && 'Gas'}
                {sensor.id === 'humidity' && 'RH'}
              </div>
              <h3>{sensor.name}</h3>
              <div className="card-value">
                {sensor.value !== null ? Number(sensor.value).toFixed(1) : '--'}
                <span>{sensor.unit}</span>
              </div>
              <div className={`card-status ${status.toLowerCase()}`}>
                {status}
              </div>
              <div className="card-description">{sensor.description}</div>
              {sensor.value === null && <p className="placeholder-text">Awaiting sensor data</p>}
            </div>
          );
        })}
      </div>

      <div className="actuator-dashboard-grid">
        <div className="actuator-card">
          <div className="actuator-title">Fan</div>
          <div className={`actuator-badge ${actuatorStatus?.fanActive ? 'active' : 'inactive'}`}>
            {getActuatorLabel(fanRuntime, actuatorStatus?.fanActive)}
          </div>
          <p>Triggered only when gas level is above {thresholds.gasMax}.</p>
          <span>Last pulse: {formatDateTime(fanRuntime?.lastActivatedAt)}</span>
        </div>

        <div className="actuator-card">
          <div className="actuator-title">Water Spray</div>
          <div className={`actuator-badge ${actuatorStatus?.waterPumpActive ? 'active' : 'inactive'}`}>
            {getActuatorLabel(sprayRuntime, actuatorStatus?.waterPumpActive)}
          </div>
          <p>Triggered only when moisture is below {thresholds.moistureMin}%.</p>
          <span>Last pulse: {formatDateTime(sprayRuntime?.lastActivatedAt)}</span>
        </div>

        <div className="actuator-card latest-activity-card">
          <div className="actuator-title">Latest Actuator Activity</div>
          {latestActivity ? (
            <>
              <strong>{latestActivity.actuatorType}</strong>
              <p>
                {latestActivity.triggerSource} value {latestActivity.triggerValue} crossed threshold {latestActivity.thresholdValue}.
              </p>
              <span>
                {latestActivity.durationSeconds}s pulse, {formatDateTime(latestActivity.startedAt)}
              </span>
            </>
          ) : (
            <p>No actuator activity has been logged yet.</p>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;
