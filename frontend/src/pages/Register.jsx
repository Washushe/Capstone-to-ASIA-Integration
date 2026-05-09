import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../services/api.js';

const authIntro = {
  title: 'Build Your Skills With Compost Intelligence',
  description:
    'Monitor compost health and stay on top of environmental conditions with live sensor history, alerts, and actuator response simulation.',
};

function Register({ onRegister }) {
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const validation = {};

    if (!profile.name.trim()) {
      validation.name = 'Name is required.';
    }

    if (!profile.email.trim()) {
      validation.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      validation.email = 'Enter a valid email address.';
    }

    if (!profile.password) {
      validation.password = 'Password is required.';
    } else if (profile.password.length < 8) {
      validation.password = 'Password must be at least 8 characters.';
    }

    setErrors(validation);
    return Object.keys(validation).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const user = await registerUser(profile);
      onRegister(user);
      navigate('/dashboard');
    } catch (err) {
      setSubmitError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-layout">
        <aside className="auth-overview">
          <div>
            <h1 className="auth-main-title">IoT Compost Accelerator</h1>
            <h2>{authIntro.title}</h2>
            <p>{authIntro.description}</p>
          </div>
        </aside>

        <div className="auth-card">
          <h1>Create your account</h1>
          <p className="auth-subtitle">Join your compost accelerator management system.</p>

          {submitError && <p className="form-message error">{submitError}</p>}

          <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Name
            <input
              type="text"
              value={profile.name}
              onChange={(e) =>
                setProfile({ ...profile, name: e.target.value })
              }
            />
            {errors.name && (
              <span className="auth-field-error">{errors.name}</span>
            )}
          </label>

          <label>
            Email
            <input
              type="email"
              value={profile.email}
              onChange={(e) =>
                setProfile({ ...profile, email: e.target.value })
              }
            />
            {errors.email && (
              <span className="auth-field-error">{errors.email}</span>
            )}
          </label>

          <label>
            Password
            <input
              type="password"
              value={profile.password}
              onChange={(e) =>
                setProfile({ ...profile, password: e.target.value })
              }
            />
            {errors.password && (
              <span className="auth-field-error">{errors.password}</span>
            )}
          </label>

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <div className="auth-footer auth-footer-right">
          <span>Already have an account?</span>
          <Link to="/"> Login</Link>
        </div>
      </div>
    </div>
  </div>
  );
}

export default Register;