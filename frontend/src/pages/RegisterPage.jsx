import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AlertModal from '../components/AlertModal';
import { theme } from '../styles/theme';

const pageStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: theme.colors.bgPage,
};

const panelStyle = {
  background: theme.colors.bgPanel,
  border: `2px solid ${theme.colors.borderGold}`,
  borderRadius: theme.radius.md,
  boxShadow: theme.shadows.panel,
  padding: theme.spacing.xl,
  width: '100%',
  maxWidth: '380px',
};

const titleStyle = {
  fontFamily: theme.fonts.header,
  fontSize: theme.fontSizes.xxl,
  color: theme.colors.textHeader,
  textAlign: 'center',
  margin: `0 0 ${theme.spacing.xl}`,
};

const fieldGroupStyle = {
  marginBottom: theme.spacing.md,
};

const labelStyle = {
  display: 'block',
  fontFamily: theme.fonts.body,
  fontSize: theme.fontSizes.sm,
  color: theme.colors.textPrimary,
  marginBottom: theme.spacing.xs,
};

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  background: theme.colors.bgPage,
  border: `1px solid ${theme.colors.borderBrown}`,
  borderRadius: theme.radius.sm,
  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
  fontFamily: theme.fonts.body,
  fontSize: theme.fontSizes.md,
  color: theme.colors.textPrimary,
  outline: 'none',
  transition: `border-color ${theme.transitions.fast}`,
};

const inputErrorStyle = {
  ...inputStyle,
  border: `1px solid ${theme.colors.statusBleed}`,
};

const fieldErrorStyle = {
  fontFamily: theme.fonts.body,
  fontSize: theme.fontSizes.xs,
  color: theme.colors.statusBleed,
  marginTop: theme.spacing.xs,
};

const submitBtnStyle = {
  width: '100%',
  marginTop: theme.spacing.md,
  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
  background: theme.colors.borderGold,
  color: theme.colors.bgPage,
  border: 'none',
  borderRadius: theme.radius.md,
  fontFamily: theme.fonts.body,
  fontSize: theme.fontSizes.md,
  fontWeight: theme.fontWeights.bold,
  cursor: 'pointer',
  transition: `background ${theme.transitions.fast}`,
};

const linkRowStyle = {
  marginTop: theme.spacing.md,
  textAlign: 'center',
  fontFamily: theme.fonts.body,
  fontSize: theme.fontSizes.sm,
  color: theme.colors.textMuted,
};

const linkStyle = {
  color: theme.colors.textHeader,
  textDecoration: 'none',
};

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
    <div style={fieldGroupStyle}>
      <label style={labelStyle} htmlFor={key}>{label}</label>
      <input
        id={key}
        type={type}
        style={fieldErrors[key] ? inputErrorStyle : inputStyle}
        value={fields[key]}
        onChange={set(key)}
        onFocus={(e) => { if (!fieldErrors[key]) e.currentTarget.style.borderColor = theme.colors.borderGold; }}
        onBlur={(e) => { if (!fieldErrors[key]) e.currentTarget.style.borderColor = theme.colors.borderBrown; }}
        autoComplete={autocomplete}
      />
      {fieldErrors[key] && <div style={fieldErrorStyle}>{fieldErrors[key]}</div>}
    </div>
  );

  return (
    <div style={pageStyle}>
      <div style={panelStyle}>
        <h1 style={titleStyle}>3JRPG</h1>
        <form onSubmit={handleSubmit} noValidate>
          {fieldInput('email', 'email', 'Email', 'email')}
          {fieldInput('nickname', 'text', 'Nickname', 'username')}
          {fieldInput('password', 'password', 'Password', 'new-password')}
          {fieldInput('confirmPassword', 'password', 'Confirm Password', 'new-password')}
          <button
            type="submit"
            style={{ ...submitBtnStyle, opacity: loading ? 0.7 : 1 }}
            disabled={loading}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = theme.colors.actionHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = theme.colors.borderGold; }}
            onMouseDown={(e) => { e.currentTarget.style.background = theme.colors.actionActive; }}
            onMouseUp={(e) => { e.currentTarget.style.background = theme.colors.actionHover; }}
          >
            {loading ? 'Registering…' : 'Register'}
          </button>
        </form>
        <div style={linkRowStyle}>
          Already have an account?{' '}
          <Link to="/login" style={linkStyle}>Login</Link>
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
