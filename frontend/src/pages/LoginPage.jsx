import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getActiveRun, giveUp } from '../services/api';
import AlertModal from '../components/AlertModal';
import { theme } from '../styles/theme';

const MODAL_CLOSED = { open: false, title: '', message: '', variant: 'info', confirmLabel: 'OK', cancelLabel: null, onConfirm: null, onCancel: null };

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/select';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(MODAL_CLOSED);

  function closeModal() {
    setModal(MODAL_CLOSED);
  }

  function showActiveRunModal(activeRun, proceedToNormal) {
    setModal({
      open: true,
      title: 'Active Run Found',
      message: 'You have an unfinished run. Would you like to resume it or give it up?',
      variant: 'warning',
      confirmLabel: 'Resume Run',
      cancelLabel: 'Give Up Run',
      onConfirm: () => {
        closeModal();
        navigate('/battle', { state: { runState: activeRun } });
      },
      onCancel: () => showGiveUpConfirm(activeRun, proceedToNormal),
    });
  }

  function showGiveUpConfirm(activeRun, proceedToNormal) {
    setModal({
      open: true,
      title: 'Give Up Run?',
      message: 'This will permanently end your current run and count as a defeat.',
      variant: 'danger',
      confirmLabel: 'Give Up',
      cancelLabel: 'Back',
      onConfirm: async () => {
        closeModal();
        try {
          await giveUp(activeRun.runUuid);
        } catch { /* ignore */ }
        proceedToNormal();
      },
      onCancel: () => showActiveRunModal(activeRun, proceedToNormal),
    });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);

      const activeRun = await getActiveRun().catch(() => null);
      if (activeRun) {
        showActiveRunModal(activeRun, () => navigate(from, { replace: true }));
        return;
      }

      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setModal({ open: true, title: 'Login Failed', message: msg, variant: 'danger', confirmLabel: 'OK', cancelLabel: null, onConfirm: closeModal, onCancel: null });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <h1 className="auth-title">3JRPG</h1>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={(e) => { e.currentTarget.style.borderColor = theme.colors.borderGold; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = theme.colors.borderBrown; }}
              autoComplete="email"
              required
            />
          </div>
          <div className="form-field-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
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
            className="form-submit-btn"
            style={{ opacity: loading ? 0.7 : 1 }}
            disabled={loading}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = theme.colors.actionHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = theme.colors.borderGold; }}
            onMouseDown={(e) => { e.currentTarget.style.background = theme.colors.actionActive; }}
            onMouseUp={(e) => { e.currentTarget.style.background = theme.colors.actionHover; }}
          >
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>
        <div className="form-link-row">
          No account?{' '}
          <Link to="/register" className="form-link">Register</Link>
        </div>
      </div>

      <AlertModal
        isOpen={modal.open}
        title={modal.title}
        message={modal.message}
        variant={modal.variant}
        confirmLabel={modal.confirmLabel}
        cancelLabel={modal.cancelLabel}
        onConfirm={modal.onConfirm}
        onCancel={modal.onCancel}
      />
    </div>
  );
}
