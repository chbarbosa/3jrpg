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

  const linkStyle = {
    fontFamily: theme.fonts.body,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.textPrimary,
    textDecoration: 'none',
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    borderRadius: theme.radius.sm,
    transition: `background ${theme.transitions.fast}`,
  };

  const navLinks = [
    { to: '/select', label: 'New Run' },
    { to: '/season', label: 'Season' },
    { to: '/profile', label: 'Profile' },
  ];

  return (
    <>
      <nav style={{
        background: theme.colors.bgPanel,
        borderBottom: `1px solid ${theme.colors.borderBrown}`,
        padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.md,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: theme.shadows.panel,
      }}>
        {/* Brand */}
        <Link
          to="/select"
          onClick={() => handleNavClick('/select')}
          style={{
            fontFamily: theme.fonts.header,
            fontSize: theme.fontSizes.lg,
            fontWeight: theme.fontWeights.black,
            color: theme.colors.textHeader,
            textDecoration: 'none',
            marginRight: theme.spacing.md,
          }}
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
                style={{
                  ...linkStyle,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
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
              style={linkStyle}
              onMouseEnter={(e) => { e.currentTarget.style.background = theme.colors.bgPanelDark; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {label}
            </Link>
          );
        })}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Player nickname */}
        {player?.nickname && (
          <span style={{
            fontFamily: theme.fonts.body,
            fontSize: theme.fontSizes.sm,
            color: theme.colors.textMuted,
          }}>
            {player.nickname}
          </span>
        )}

        {/* Sound toggle */}
        <button
          onClick={handleToggleSound}
          aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
          title={soundEnabled ? 'Sound on' : 'Sound off'}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: theme.spacing.xs,
            borderRadius: theme.radius.sm,
            fontSize: theme.fontSizes.lg,
            color: theme.colors.textHeader,
            lineHeight: 1,
            transition: `background ${theme.transitions.fast}`,
            opacity: soundEnabled ? 1 : 0.45,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = theme.colors.actionHover; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            padding: `${theme.spacing.xs} ${theme.spacing.md}`,
            background: 'transparent',
            border: `1px solid ${theme.colors.borderBrown}`,
            borderRadius: theme.radius.sm,
            color: theme.colors.textPrimary,
            fontFamily: theme.fonts.body,
            fontSize: theme.fontSizes.sm,
            cursor: 'pointer',
            transition: `background ${theme.transitions.fast}`,
          }}
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
