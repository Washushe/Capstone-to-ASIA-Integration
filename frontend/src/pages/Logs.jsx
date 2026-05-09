import { useEffect, useState } from 'react';
import Layout from '../components/Layout.jsx';
import { getSensorReadings } from '../services/api.js';

function deriveLogEntry(reading) {
  const gasHigh = reading.gasStatus === 'HIGH';
  const moistureLow = reading.moistureStatus === 'LOW';
  const moistureHigh = reading.moistureStatus === 'HIGH';

  let event = 'System stable';
  let source = 'No threshold exceeded';
  let status = 'NORMAL';

  if (gasHigh) {
    event = 'Fan triggered for 5 seconds';
    source = 'Gas exceeded the threshold limit';
    status = 'HIGH';
  } else if (moistureLow) {
    event = 'Water pump triggered for 5 seconds';
    source = 'Moisture dropped below the threshold';
    status = 'LOW';
  } else if (moistureHigh) {
    event = 'Moisture release system activated for 5 seconds';
    source = 'Moisture exceeded the safe range';
    status = 'HIGH';
  }

  return {
    event,
    source,
    status,
    timestamp: new Date(reading.createdAt).toLocaleString(),
    id: reading.readingId,
  };
}

function Logs({ user, online, setOnline }) {
  const [logEntries, setLogEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        const readings = await getSensorReadings();
        const allEntries = readings.map(deriveLogEntry);
        // Filter to show only entries where an actuator was triggered
        const triggeredEntries = allEntries.filter(
          (entry) => entry.status !== 'NORMAL' || entry.event !== 'System stable'
        );
        setLogEntries(triggeredEntries);
      } catch (error) {
        setLogEntries([]);
      } finally {
        setLoading(false);
      }
    }

    loadLogs();
  }, []);

  return (
    <Layout
      user={user}
      title="Logs / History"
      subtitle="View sensor and system events from recorded readings"
      online={online}
      setOnline={setOnline}
    >
      <div className="logs-panel">
        <table className="logs-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Source</th>
              <th>Status</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="empty-state">
                  Loading log entries...
                </td>
              </tr>
            ) : logEntries.length === 0 ? (
              <tr>
                <td colSpan="4" className="empty-state">
                  No log entries available yet.
                </td>
              </tr>
            ) : (
              logEntries.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.event}</td>
                  <td>{entry.source}</td>
                  <td>{entry.status}</td>
                  <td>{entry.timestamp}</td>
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
