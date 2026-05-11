import { useEffect, useState } from 'react';
import Layout from '../components/Layout.jsx';
import { getSensorReadings } from '../services/api.js';

function Logs({ user, online, setOnline }) {
  const [sensorReadings, setSensorReadings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSensorReadings() {
      try {
        const readings = await getSensorReadings();
        // Sort by timestamp descending (newest first) and take latest 50
        const sortedReadings = readings
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 50);
        setSensorReadings(sortedReadings);
      } catch (error) {
        setSensorReadings([]);
      } finally {
        setLoading(false);
      }
    }

    loadSensorReadings();
  }, []);

  return (
    <Layout
      user={user}
      title="Logs / History"
      subtitle="View latest sensor readings from the database"
      online={online}
      setOnline={setOnline}
    >
      <div className="logs-panel">
        <table className="logs-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Temperature (°C)</th>
              <th>Moisture (%)</th>
              <th>Gas (PPM)</th>
              <th>Humidity (%)</th>
              <th>Moisture Status</th>
              <th>Gas Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="empty-state">
                  Loading sensor readings...
                </td>
              </tr>
            ) : sensorReadings.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-state">
                  No sensor readings available yet.
                </td>
              </tr>
            ) : (
              sensorReadings.map((reading) => (
                <tr key={reading.readingId}>
                  <td>{new Date(reading.createdAt).toLocaleString()}</td>
                  <td>{reading.temperatureC?.toFixed(1) || '--'}</td>
                  <td>{reading.moistureLevel?.toFixed(1) || '--'}</td>
                  <td>{reading.gasLevel?.toFixed(1) || '--'}</td>
                  <td>{reading.humidityLevel?.toFixed(1) || '--'}</td>
                  <td className={`status-${reading.moistureStatus?.toLowerCase() || 'unknown'}`}>
                    {reading.moistureStatus || 'Unknown'}
                  </td>
                  <td className={`status-${reading.gasStatus?.toLowerCase() || 'unknown'}`}>
                    {reading.gasStatus || 'Unknown'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

export default Logs;
