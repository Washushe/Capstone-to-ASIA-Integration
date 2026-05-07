import Layout from '../components/Layout.jsx';

function Logs({ user, online, setOnline }) {
  return (
    <Layout
      user={user}
      title="Logs / History"
      subtitle="View sensor and System History"
      online={online}
      setOnline={setOnline}
    >
      <div className="logs-panel">
        <table className="logs-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Event</th>
              <th>Source</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="4" className="empty-state">
                No log entries available yet.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

export default Logs;
