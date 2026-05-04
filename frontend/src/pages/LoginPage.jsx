import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { sessionCheck } from '../services/api';
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

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/select';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);

  const closeModal = () => setModal(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      const check = await sessionCheck();
      if (check.timeout) {
        setModal({
          title: 'Session Expired',
          message: 'Your previous session expired.',
          variant: 'info',
          onConfirm: () => {
            closeModal();
            navigate('/gameover', { state: { timeout: true, fightsSurvived: check.fightsSurvived } });
          },
        });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setModal({ title: 'Login Failed', message: msg, variant: 'danger', onConfirm: closeModal });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={panelStyle}>
        <h1 style={titleStyle}>3JRPG</h1>
        <form onSubmit={handleSubmit} noValidate>
          <div style={fieldGroupStyle}>
            <label style={labelStyle} htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              style={inputStyle}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={(e) => { e.currentTarget.style.borderColor = theme.colors.borderGold; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = theme.colors.borderBrown; }}
              autoComplete="email"
              required
            />
          </div>
          <div style={fieldGroupStyle}>
            <label style={labelStyle} htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              style={inputStyle}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={(e) => { e.currentTarget.style.borderColor = theme.colors.borderGold; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = theme.colors.borderBrown; }}
              autoComplete="current-password"
              required
            />
          </div>
          <button
            type="submit"
            style={{ ...submitBtnStyle, opacity: loading ? 0.7 : 1 }}
            disabled={loading}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = theme.colors.actionHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = theme.colors.borderGold; }}
            onMouseDown={(e) => { e.currentTarget.style.background = theme.colors.actionActive; }}
            onMouseUp={(e) => { e.currentTarget.style.background = theme.colors.actionHover; }}
          >
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>
        <div style={linkRowStyle}>
          No account?{' '}
          <Link to="/register" style={linkStyle}>Register</Link>
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
