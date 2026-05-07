import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: '', password: '' });

  const handleSubmit = (event) => {
    event.preventDefault();
    onLogin({ name: 'Composter', email: credentials.email });
    navigate('/dashboard');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>IoT-Based Compost Accelerator</h1>
        <p className="auth-subtitle">Login to access monitoring, AI prediction, and control.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              value={credentials.email}
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              required
            />
          </label>
          <button type="submit" className="primary-button">
            Login
          </button>
        </form>

        <div className="auth-footer">
          <span>Don't have an account?</span>
          <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
