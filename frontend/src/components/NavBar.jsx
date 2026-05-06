import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { theme } from '../styles/theme';
import { setSoundEnabled, isSoundEnabled, playSound } from '../services/sound';
import { getActiveRun, giveUp } from '../services/api';
import AlertModal from './AlertModal';

const MODAL_CLOSED = { open: false, title: '', message: '', variant: 'info', confirmLabel: 'OK', cancelLabel: null, onConfirm: null, onCancel: null };
const ACTIVE_PATHS = new Set(['/battle', '/prep']);

export default function NavBar() {
  const { isAuthenticated, player, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [soundEnabled, setSoundEnabledLocal] = useState(isSoundEnabled());
  const [modal, setModal] = useState(MODAL_CLOSED);

  if (!isAuthenticated) return null;

  const onActivePage = ACTIVE_PATHS.has(location.pathname);

  function closeModal() {
    setModal(MODAL_CLOSED);
  }

  async function executeGiveUpThenProceed(proceed) {
    try {
      const run = await getActiveRun();
      if (run?.runUuid) {
        await giveUp(run.runUuid);
      }
    } catch { /* proceed regardless */ }
    proceed();
  }

  function promptGiveUpThen(proceed) {
    setModal({
      open: true,
      title: 'Give Up Run?',
      message: 'Leaving will end your current run and count as a defeat. Are you sure?',
      variant: 'danger',
      confirmLabel: 'Give Up & Leave',
      cancelLabel: 'Stay',
      onConfirm: () => { closeModal(); executeGiveUpThenProceed(proceed); },
      onCancel: closeModal,
    });
  }

  function handleLogout() {
    if (onActivePage) {
      promptGiveUpThen(() => { logout(); navigate('/'); });
    } else {
      logout();
      navigate('/');
    }
  }

  function handleNavClick(to) {
    playSound('uiNav');
    if (onActivePage && to !== location.pathname) {
      promptGiveUpThen(() => navigate(to));
    }
    // else: let the Link handle navigation normally
  }

  function handleToggleSound() {
    const next = !soundEnabled;
    setSoundEnabledLocal(next);
    setSoundEnabled(next);
  }

  const navLinks = [
    { to: '/select', label: 'New Run' },
    { to: '/season', label: 'Season' },
    { to: '/profile', label: 'Profile' },
  ];

  return (
    <>
      <nav className="navbar">
        {/* Brand */}
        <Link
          to="/select"
          onClick={() => handleNavClick('/select')}
          className="navbar-brand"
        >
          3JRPG
        </Link>

        {/* Nav links */}
        {navLinks.map(({ to, label }) => {
          if (onActivePage) {
            return (
              <button
                key={to}
                onClick={() => handleNavClick(to)}
                className="navbar-link-btn"
                onMouseEnter={(e) => { e.currentTarget.style.background = theme.colors.bgPanelDark; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                {label}
              </button>
            );
          }
          return (
            <Link
              key={to}
              to={to}
              onClick={() => playSound('uiNav')}
              className="navbar-link"
              onMouseEnter={(e) => { e.currentTarget.style.background = theme.colors.bgPanelDark; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {label}
            </Link>
          );
        })}

        {/* Spacer */}
        <div className="navbar-spacer" />

        {/* Player nickname */}
        {player?.nickname && (
          <span className="navbar-nickname">
            {player.nickname}
          </span>
        )}

        {/* Sound toggle */}
        <button
          onClick={handleToggleSound}
          aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
          title={soundEnabled ? 'Sound on' : 'Sound off'}
          className="navbar-sound-btn"
          style={{ opacity: soundEnabled ? 1 : 0.45 }}
          onMouseEnter={(e) => { e.currentTarget.style.background = theme.colors.actionHover; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="navbar-logout-btn"
          onMouseEnter={(e) => { e.currentTarget.style.background = theme.colors.bgPanelDark; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          Log Out
        </button>
      </nav>

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
    </>
  );
}
