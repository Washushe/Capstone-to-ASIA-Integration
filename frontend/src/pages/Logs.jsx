import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout.jsx';
import { getActuatorLogs, getSensorReadings } from '../services/api.js';

function Logs({ user, online, setOnline }) {
  const [sensorReadings, setSensorReadings] = useState([]);
  const [actuatorLogs, setActuatorLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadLogs() {
      try {
        const [readings, logs] = await Promise.all([
          getSensorReadings(),
          getActuatorLogs(),
        ]);

        setSensorReadings(Array.isArray(readings) ? readings : []);
        setActuatorLogs(Array.isArray(logs) ? logs : []);
      } catch {
        setSensorReadings([]);
        setActuatorLogs([]);
      } finally {
        setLoading(false);
      }
    }

    loadLogs();
  }, []);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredReadings = useMemo(() => {
    return sensorReadings.filter((reading) => {
      const statusMatch =
        statusFilter === 'ALL' ||
        reading.moistureStatus === statusFilter ||
        reading.gasStatus === statusFilter ||
        reading.temperatureStatus === statusFilter ||
        reading.humidityStatus === statusFilter;
      if (!statusMatch) return false;

      if (!normalizedSearch) return true;

      const timestamp = new Date(reading.createdAt).toLocaleString().toLowerCase();
      return (
        timestamp.includes(normalizedSearch) ||
        `${reading.temperatureC}`.includes(normalizedSearch) ||
        `${reading.moistureLevel}`.includes(normalizedSearch) ||
        `${reading.gasLevel}`.includes(normalizedSearch) ||
        `${reading.humidityLevel}`.includes(normalizedSearch)
      );
    });
  }, [sensorReadings, statusFilter, normalizedSearch]);

  const filteredActuatorLogs = useMemo(() => {
    if (!normalizedSearch) return actuatorLogs;

    return actuatorLogs.filter((log) => {
      const timestamp = new Date(log.createdAt).toLocaleString().toLowerCase();
      return (
        timestamp.includes(normalizedSearch) ||
        `${log.actuatorType}`.toLowerCase().includes(normalizedSearch) ||
        `${log.triggerSource}`.toLowerCase().includes(normalizedSearch) ||
        `${log.triggerValue}`.includes(normalizedSearch) ||
        `${log.thresholdValue}`.includes(normalizedSearch)
      );
    });
  }, [actuatorLogs, normalizedSearch]);

  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    if (status === 'NORMAL') return 'Optimal';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined) return '--';
    return Number(value).toFixed(1);
  };

  const formatDateTime = (value) => {
    if (!value) return '--';
    return new Date(value).toLocaleString();
  };

  return (
    <Layout
      user={user}
      title="Logs / History"
      subtitle="View sensor readings and actuator pulses from the database"
      online={online}
      setOnline={setOnline}
    >
      <div className="logs-panel">
        <div className="logs-toolbar">
          <div className="logs-filter">
            <label htmlFor="statusFilter">Sensor status</label>
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
              placeholder="Search timestamp, sensor, or actuator"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>

        <h3 className="logs-section-title">Sensor Reading History</h3>
        <table className="logs-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Temperature (°C)</th>
              <th>Moisture (%)</th>
              <th>Gas (index)</th>
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
                <td colSpan="9" className="empty-state">
                  Loading sensor readings...
                </td>
              </tr>
            ) : filteredReadings.length === 0 ? (
              <tr>
                <td colSpan="9" className="empty-state">
                  No sensor readings match the selected filter.
                </td>
              </tr>
            ) : (
              filteredReadings.map((reading) => (
                <tr key={reading.readingId}>
                  <td>{formatDateTime(reading.createdAt)}</td>
                  <td>{formatNumber(reading.temperatureC)}</td>
                  <td>{formatNumber(reading.moistureLevel)}</td>
                  <td>{formatNumber(reading.gasLevel)}</td>
                  <td>{formatNumber(reading.humidityLevel)}</td>
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

        <h3 className="logs-section-title">Actuator Log History</h3>
        <table className="logs-table">
          <thead>
            <tr>
              <th>Started</th>
              <th>Ended</th>
              <th>Actuator Type</th>
              <th>Status</th>
              <th>Trigger Source</th>
              <th>Trigger Value</th>
              <th>Threshold Value</th>
              <th>Duration</th>
              <th>Reading ID</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" className="empty-state">
                  Loading actuator logs...
                </td>
              </tr>
            ) : filteredActuatorLogs.length === 0 ? (
              <tr>
                <td colSpan="9" className="empty-state">
                  No actuator logs match the current search.
                </td>
              </tr>
            ) : (
              filteredActuatorLogs.map((log) => (
                <tr key={log.logId}>
                  <td>{formatDateTime(log.startedAt)}</td>
                  <td>{formatDateTime(log.endedAt)}</td>
                  <td>{log.actuatorType}</td>
                  <td>{log.status}</td>
                  <td>{log.triggerSource}</td>
                  <td>{formatNumber(log.triggerValue)}</td>
                  <td>{formatNumber(log.thresholdValue)}</td>
                  <td>{log.durationSeconds ?? '--'}s</td>
                  <td>{log.readingId ?? '--'}</td>
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
