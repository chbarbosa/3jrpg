import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../styles/theme';

const pageStyle = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: theme.colors.bgPage,
  gap: theme.spacing.xl,
};

const titleStyle = {
  fontFamily: theme.fonts.header,
  fontSize: theme.fontSizes.xxl,
  color: theme.colors.textHeader,
  letterSpacing: '0.08em',
  margin: 0,
};

const subtitleStyle = {
  fontFamily: theme.fonts.body,
  fontSize: theme.fontSizes.sm,
  color: theme.colors.textMuted,
  marginTop: theme.spacing.xs,
  textAlign: 'center',
};

const buttonGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing.sm,
  width: '220px',
};

const primaryBtnStyle = {
  width: '100%',
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

const secondaryBtnStyle = {
  width: '100%',
  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
  background: 'transparent',
  color: theme.colors.textPrimary,
  border: `1px solid ${theme.colors.borderBrown}`,
  borderRadius: theme.radius.md,
  fontFamily: theme.fonts.body,
  fontSize: theme.fontSizes.md,
  cursor: 'pointer',
  transition: `background ${theme.transitions.fast}`,
};

export default function MenuPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={pageStyle}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={titleStyle}>3JRPG</h1>
        <p style={subtitleStyle}>An endless magitech battle</p>
      </div>
      <div style={buttonGroupStyle}>
        {isAuthenticated ? (
          <button
            style={primaryBtnStyle}
            onClick={() => navigate('/select')}
            onMouseEnter={(e) => { e.currentTarget.style.background = theme.colors.actionHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = theme.colors.borderGold; }}
            onMouseDown={(e) => { e.currentTarget.style.background = theme.colors.actionActive; }}
            onMouseUp={(e) => { e.currentTarget.style.background = theme.colors.actionHover; }}
          >
            Continue
          </button>
        ) : (
          <>
            <button
              style={primaryBtnStyle}
              onClick={() => navigate('/login')}
              onMouseEnter={(e) => { e.currentTarget.style.background = theme.colors.actionHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = theme.colors.borderGold; }}
              onMouseDown={(e) => { e.currentTarget.style.background = theme.colors.actionActive; }}
              onMouseUp={(e) => { e.currentTarget.style.background = theme.colors.actionHover; }}
            >
              Login
            </button>
            <button
              style={secondaryBtnStyle}
              onClick={() => navigate('/register')}
              onMouseEnter={(e) => { e.currentTarget.style.background = theme.colors.bgPanelDark; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              Register
            </button>
          </>
        )}
      </div>
    </div>
  );
}
