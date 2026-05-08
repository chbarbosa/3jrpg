import { useState, useRef } from 'react';
import { theme } from '../styles/theme';

export default function Tooltip({ text, children }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  function onEnter() {
    timerRef.current = setTimeout(() => setVisible(true), 200);
  }

  function onLeave() {
    clearTimeout(timerRef.current);
    setVisible(false);
  }

  return (
    <div
      style={{ position: 'relative', display: 'block', width: '100%' }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {children}
      {visible && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: theme.spacing.xs,
            background: theme.colors.bgPanelDark,
            border: `1px solid ${theme.colors.borderGold}`,
            borderRadius: theme.radius.sm,
            fontFamily: theme.fonts.body,
            fontSize: theme.fontSizes.xs,
            color: theme.colors.textPrimary,
            padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
            maxWidth: '200px',
            zIndex: 100,
            pointerEvents: 'none',
            opacity: 1,
            transition: theme.transitions.fast,
            whiteSpace: 'normal',
            textAlign: 'center',
            boxShadow: theme.shadows.panel,
            lineHeight: '1.4',
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
}
