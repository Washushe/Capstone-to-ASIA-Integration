import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../services/api.js';

const authIntro = {
  title: 'Build Your Skills With Compost Intelligence',
  description:
    'Monitor compost health and stay on top of environmental conditions with live sensor history, alerts, and actuator response simulation.',
};

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [form, setForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const validation = {};

    if (!token) {
      validation.token = 'Reset token is missing.';
    }

    if (!form.newPassword) {
      validation.newPassword = 'New password is required.';
    } else if (form.newPassword.length < 8) {
      validation.newPassword = 'New password must be at least 8 characters.';
    }

    if (form.confirmPassword !== form.newPassword) {
      validation.confirmPassword = 'Confirm password must match the new password.';
    }

    setErrors(validation);
    return Object.keys(validation).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setSubmitError('');

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const response = await resetPassword(token, form.newPassword, form.confirmPassword);
      setMessage(response.message || 'Password reset successful. You may now log in.');
      setForm({
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setSubmitError(err.message || 'Unable to reset password.');
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
          <h1>Create new password</h1>
          <p className="auth-subtitle">Choose a new password for your account.</p>

          {message && <p className="form-message success">{message}</p>}
          {submitError && <p className="form-message error">{submitError}</p>}
          {errors.token && <p className="form-message error">{errors.token}</p>}

          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              New password
              <input
                type="password"
                value={form.newPassword}
                onChange={(event) =>
                  setForm({ ...form, newPassword: event.target.value })
                }
              />
              {errors.newPassword && (
                <span className="auth-field-error">{errors.newPassword}</span>
              )}
            </label>

            <label>
              Confirm password
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(event) =>
                  setForm({ ...form, confirmPassword: event.target.value })
                }
              />
              {errors.confirmPassword && (
                <span className="auth-field-error">{errors.confirmPassword}</span>
              )}
            </label>

            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? 'Saving...' : 'Reset Password'}
            </button>
          </form>

          <div className="auth-footer auth-footer-right">
            <Link to="/">Back to login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
