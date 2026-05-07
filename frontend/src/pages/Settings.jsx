import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';

function Settings({ user, online, onLogout }) {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('me');
  const [thresholds, setThresholds] = useState({ moisture: '', gas: '' });

  return (
    <Layout
      user={user}
      title="Settings"
      subtitle="Full-screen settings mode"
      online={online}
      hideSidebar
    >
      <div className="settings-page-wrapper">
        <div className="settings-header-row">
          <button className="back-button" onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
        </div>

        <div className="settings-screen">
          <aside className="settings-inner-sidebar">
            <button
              className={activeSection === 'me' ? 'active' : ''}
              onClick={() => setActiveSection('me')}
            >
              Me
            </button>
            <button
              className={activeSection === 'controls' ? 'active' : ''}
              onClick={() => setActiveSection('controls')}
            >
              Actuator Controls
            </button>
            <button
              className={activeSection === 'thresholds' ? 'active' : ''}
              onClick={() => setActiveSection('thresholds')}
            >
              Threshold Setting
            </button>
          </aside>

          <div className="settings-panel-content">
            {activeSection === 'me' && (
              <div className="info-box settings-full-box settings-me-box">
                <div>
                  <h4>Me</h4>
                  <p>Account information and profile details will appear here.</p>
                </div>
                <button className="logout-button" onClick={onLogout}>
                  Logout
                </button>
              </div>
            )}

            {activeSection === 'controls' && (
              <div className="info-box settings-full-box">
                <h4>Actuator Controls</h4>
                <p>This section is reserved for future control settings.</p>
              </div>
            )}

            {activeSection === 'thresholds' && (
              <div className="info-box settings-full-box">
                <h4>Threshold Setting</h4>
                <div className="threshold-form">
                  <label>
                    Moisture threshold (%)
                    <input
                      type="number"
                      value={thresholds.moisture}
                      onChange={(event) =>
                        setThresholds((current) => ({ ...current, moisture: event.target.value }))
                      }
                      placeholder="Enter moisture threshold"
                    />
                  </label>
                  <label>
                    Gas threshold (PPM)
                    <input
                      type="number"
                      value={thresholds.gas}
                      onChange={(event) =>
                        setThresholds((current) => ({ ...current, gas: event.target.value }))
                      }
                      placeholder="Enter gas threshold"
                    />
                  </label>
                  <p className="note-text">Values are saved only in the UI for now; backend integration is not enabled.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Settings;
