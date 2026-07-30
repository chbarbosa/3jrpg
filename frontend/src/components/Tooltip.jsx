import { useLayoutEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { theme } from '../styles/theme';

export default function Tooltip({ text, children }) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState(null);
  const timerRef = useRef(null);
  const anchorRef = useRef(null);
  const tooltipRef = useRef(null);

  useLayoutEffect(() => {
    if (!visible) return undefined;

    function updatePosition() {
      if (!anchorRef.current || !tooltipRef.current) return;
      const anchor = anchorRef.current.getBoundingClientRect();
      const tooltip = tooltipRef.current.getBoundingClientRect();
      const gap = Number.parseFloat(theme.spacing.xs);
      const viewportPadding = Number.parseFloat(theme.spacing.sm);
      const fitsAbove = anchor.top >= tooltip.height + gap + viewportPadding;
      const top = fitsAbove
        ? anchor.top - tooltip.height - gap
        : anchor.bottom + gap;
      const centeredLeft = anchor.left + anchor.width / 2;
      const left = Math.min(
        window.innerWidth - tooltip.width / 2 - viewportPadding,
        Math.max(tooltip.width / 2 + viewportPadding, centeredLeft),
      );
      setPosition({ top, left });
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [visible, text]);

  function onEnter() {
    timerRef.current = setTimeout(() => setVisible(true), 200);
  }

  function onLeave() {
    clearTimeout(timerRef.current);
    setVisible(false);
    setPosition(null);
  }

  return (
    <div
      ref={anchorRef}
      style={{ position: 'relative', display: 'block', width: '100%' }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {children}
      {visible && ReactDOM.createPortal(
        <div
          ref={tooltipRef}
          style={{
            position: 'fixed',
            top: position?.top ?? 0,
            left: position?.left ?? 0,
            transform: 'translateX(-50%)',
            background: theme.colors.bgPanelDark,
            border: `1px solid ${theme.colors.borderGold}`,
            borderRadius: theme.radius.sm,
            fontFamily: theme.fonts.body,
            fontSize: theme.fontSizes.xs,
            color: theme.colors.textPrimary,
            padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
            maxWidth: '200px',
            zIndex: 150,
            pointerEvents: 'none',
            opacity: 1,
            whiteSpace: 'normal',
            textAlign: 'center',
            boxShadow: theme.shadows.panel,
            lineHeight: '1.4',
            visibility: position ? 'visible' : 'hidden',
          }}
        >
          {text}
        </div>,
        document.body,
      )}
    </div>
  );
}
