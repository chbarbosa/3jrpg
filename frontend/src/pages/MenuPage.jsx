import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../styles/theme';

export default function MenuPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="menu-page">
      <div className="menu-title-section">
        <h1 className="menu-title">3JRPG</h1>
        <p className="menu-subtitle">An endless magitech battle</p>
      </div>
      <div className="menu-btn-group">
        {isAuthenticated ? (
          <button
            className="menu-primary-btn"
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
              className="menu-primary-btn"
              onClick={() => navigate('/login')}
              onMouseEnter={(e) => { e.currentTarget.style.background = theme.colors.actionHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = theme.colors.borderGold; }}
              onMouseDown={(e) => { e.currentTarget.style.background = theme.colors.actionActive; }}
              onMouseUp={(e) => { e.currentTarget.style.background = theme.colors.actionHover; }}
            >
              Login
            </button>
            <button
              className="menu-secondary-btn"
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
