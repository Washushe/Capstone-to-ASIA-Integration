import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Register({ onRegister }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ name: '', email: '', password: '' });

  const handleSubmit = (event) => {
    event.preventDefault();
    onRegister({ name: profile.name || 'Composter', email: profile.email });
    navigate('/dashboard');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create your account</h1>
        <p className="auth-subtitle">Join your IoT compost accelerator management system.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Name
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={profile.password}
              onChange={(e) => setProfile({ ...profile, password: e.target.value })}
              required
            />
          </label>
          <button type="submit" className="primary-button">
            Register
          </button>
        </form>

        <div className="auth-footer">
          <span>Already have an account?</span>
          <Link to="/">Login</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
