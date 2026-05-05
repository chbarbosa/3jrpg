import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { theme } from '../styles/theme';

export default function NavBar() {
  const { isAuthenticated, player, logout } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) return null;

  function handleLogout() {
    logout();
    navigate('/');
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

  return (
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
      <Link to="/select" style={{
        fontFamily: theme.fonts.header,
        fontSize: theme.fontSizes.lg,
        fontWeight: theme.fontWeights.black,
        color: theme.colors.textHeader,
        textDecoration: 'none',
        marginRight: theme.spacing.md,
      }}>
        3JRPG
      </Link>

      {/* Nav links */}
      <Link
        to="/select"
        style={linkStyle}
        onMouseEnter={(e) => { e.currentTarget.style.background = theme.colors.bgPanelDark; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        New Run
      </Link>
      <Link
        to="/season"
        style={linkStyle}
        onMouseEnter={(e) => { e.currentTarget.style.background = theme.colors.bgPanelDark; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        Season
      </Link>

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
  );
}
