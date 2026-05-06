import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AlertModal from '../components/AlertModal';
import { theme } from '../styles/theme';

function validate({ email, nickname, password, confirmPassword }) {
  const errors = {};
  if (!/.+@.+\..+/.test(email)) errors.email = 'Enter a valid email address.';
  if (nickname.length < 3 || nickname.length > 30) errors.nickname = 'Nickname must be 3–30 characters.';
  if (password.length < 8) errors.password = 'Password must be at least 8 characters.';
  if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';
  return errors;
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fields, setFields] = useState({ email: '', nickname: '', password: '', confirmPassword: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);

  const set = (key) => (e) => {
    setFields((f) => ({ ...f, [key]: e.target.value }));
    if (fieldErrors[key]) setFieldErrors((fe) => ({ ...fe, [key]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(fields);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      await register(fields.email, fields.nickname, fields.password);
      navigate('/select', { replace: true });
    } catch (err) {
      const status = err.response?.status;
      const msg = status === 409
        ? 'This email is already registered.'
        : (err.response?.data?.message || 'Registration failed. Please try again.');
      setModal({ title: 'Registration Failed', message: msg, variant: 'danger', onConfirm: () => setModal(null) });
    } finally {
      setLoading(false);
    }
  };

  const fieldInput = (key, type, label, autocomplete) => (
    <div className="form-field-group">
      <label className="form-label" htmlFor={key}>{label}</label>
      <input
        id={key}
        type={type}
        className={fieldErrors[key] ? 'form-input form-input--error' : 'form-input'}
        value={fields[key]}
        onChange={set(key)}
        onFocus={(e) => { if (!fieldErrors[key]) e.currentTarget.style.borderColor = theme.colors.borderGold; }}
        onBlur={(e) => { if (!fieldErrors[key]) e.currentTarget.style.borderColor = theme.colors.borderBrown; }}
        autoComplete={autocomplete}
      />
      {fieldErrors[key] && <div className="form-field-error">{fieldErrors[key]}</div>}
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <h1 className="auth-title">3JRPG</h1>
        <form onSubmit={handleSubmit} noValidate>
          {fieldInput('email', 'email', 'Email', 'email')}
          {fieldInput('nickname', 'text', 'Nickname', 'username')}
          {fieldInput('password', 'password', 'Password', 'new-password')}
          {fieldInput('confirmPassword', 'password', 'Confirm Password', 'new-password')}
          <button
            type="submit"
            className="form-submit-btn"
            style={{ opacity: loading ? 0.7 : 1 }}
            disabled={loading}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = theme.colors.actionHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = theme.colors.borderGold; }}
            onMouseDown={(e) => { e.currentTarget.style.background = theme.colors.actionActive; }}
            onMouseUp={(e) => { e.currentTarget.style.background = theme.colors.actionHover; }}
          >
            {loading ? 'Registering…' : 'Register'}
          </button>
        </form>
        <div className="form-link-row">
          Already have an account?{' '}
          <Link to="/login" className="form-link">Login</Link>
        </div>
      </div>

      {modal && (
        <AlertModal
          isOpen
          title={modal.title}
          message={modal.message}
          variant={modal.variant}
          confirmLabel="OK"
          onConfirm={modal.onConfirm}
        />
      )}
    </div>
  );
}
