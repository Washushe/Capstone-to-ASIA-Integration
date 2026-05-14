import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout.jsx';
import { getSensorReadings } from '../services/api.js';

function Logs({ user, online, setOnline }) {
  const [sensorReadings, setSensorReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadSensorReadings() {
      try {
        const readings = await getSensorReadings();
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

  const filteredReadings = useMemo(() => {
    return sensorReadings.filter((reading) => {
      const statusMatch =
        statusFilter === 'ALL' ||
        reading.moistureStatus === statusFilter ||
        reading.gasStatus === statusFilter;
      if (!statusMatch) return false;

      const normalizedSearch = searchTerm.trim().toLowerCase();
      if (!normalizedSearch) return true;

      const timestamp = new Date(reading.createdAt).toLocaleString().toLowerCase();
      return (
        timestamp.includes(normalizedSearch) ||
        `${reading.temperatureC?.toFixed(1)}`.includes(normalizedSearch) ||
        `${reading.moistureLevel?.toFixed(1)}`.includes(normalizedSearch) ||
        `${reading.gasLevel?.toFixed(1)}`.includes(normalizedSearch) ||
        `${reading.humidityLevel?.toFixed(1)}`.includes(normalizedSearch)
      );
    });
  }, [sensorReadings, statusFilter, searchTerm]);

  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    if (status === 'NORMAL') return 'Optimal';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  return (
    <Layout
      user={user}
      title="Logs / History"
      subtitle="View latest sensor readings from the database"
      online={online}
      setOnline={setOnline}
    >
      <div className="logs-panel">
        <div className="logs-toolbar">
          <div className="logs-filter">
            <label htmlFor="statusFilter">Status filter</label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="ALL">All</option>
              <option value="LOW">Low</option>
              <option value="NORMAL">Optimal</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <div className="logs-search">
            <label htmlFor="searchTerm">Search</label>
            <input
              id="searchTerm"
              type="text"
              placeholder="Search timestamp or value"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>

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
              <th>Temperature Status</th>
              <th>Humidity Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="empty-state">
                  Loading sensor readings...
                </td>
              </tr>
            ) : filteredReadings.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-state">
                  No sensor readings match the selected filter.
                </td>
              </tr>
            ) : (
              filteredReadings.map((reading) => (
                <tr key={reading.readingId}>
                  <td>{new Date(reading.createdAt).toLocaleString()}</td>
                  <td>{reading.temperatureC?.toFixed(1) || '--'}</td>
                  <td>{reading.moistureLevel?.toFixed(1) || '--'}</td>
                  <td>{reading.gasLevel?.toFixed(1) || '--'}</td>
                  <td>{reading.humidityLevel?.toFixed(1) || '--'}</td>
                  <td className={`status-${reading.moistureStatus?.toLowerCase() || 'unknown'}`}>
                    {formatStatus(reading.moistureStatus)}
                  </td>
                  <td className={`status-${reading.gasStatus?.toLowerCase() || 'unknown'}`}>
                    {formatStatus(reading.gasStatus)}
                  </td>
                  <td className={`status-${reading.temperatureStatus?.toLowerCase() || 'unknown'}`}>
                    {formatStatus(reading.temperatureStatus)}
                  </td>
                  <td className={`status-${reading.humidityStatus?.toLowerCase() || 'unknown'}`}>
                    {formatStatus(reading.humidityStatus)}
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
