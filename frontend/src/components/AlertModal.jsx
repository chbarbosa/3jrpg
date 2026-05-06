import { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { theme } from '../styles/theme';
import { playSound } from '../services/sound';

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

const titleColorMap = {
  warning: theme.colors.textHeader,
  danger:  theme.colors.statusBleed,
  info:    theme.colors.textPrimary,
};

export default function AlertModal({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  variant = 'info',
}) {
  const [visible, setVisible] = useState(false);
  const panelRef = useRef(null);
  const confirmRef = useRef(null);

  // Fade/scale transition
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  // Initial focus on confirm button
  useEffect(() => {
    if (isOpen) confirmRef.current?.focus();
  }, [isOpen]);

  // Escape / Enter global keys
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e) => {
      if (e.key === 'Enter') onConfirm?.();
      if (e.key === 'Escape') onCancel ? onCancel() : onConfirm?.();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [isOpen, onConfirm, onCancel]);

  // Focus trap — Tab / Shift+Tab cycles within modal
  useEffect(() => {
    if (!isOpen) return;
    const panel = panelRef.current;
    if (!panel) return;

    const trap = (e) => {
      if (e.key !== 'Tab') return;
      const nodes = [...panel.querySelectorAll(FOCUSABLE)];
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    panel.addEventListener('keydown', trap);
    return () => panel.removeEventListener('keydown', trap);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = () => (onCancel ? onCancel() : onConfirm?.());

  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    background: theme.colors.overlayBg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    opacity: visible ? 1 : 0,
    transition: `opacity ${theme.transitions.normal}`,
  };

  const panelStyle = {
    background: theme.colors.bgPanel,
    border: `2px solid ${theme.colors.borderGold}`,
    borderRadius: theme.radius.lg,
    boxShadow: theme.shadows.panel,
    padding: theme.spacing.xl,
    maxWidth: '420px',
    width: '90%',
    transform: visible ? 'scale(1)' : 'scale(0.92)',
    transition: `transform ${theme.transitions.normal}`,
  };

  const titleStyle = {
    fontFamily: theme.fonts.header,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.bold,
    color: titleColorMap[variant] ?? theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  };

  const messageStyle = {
    fontFamily: theme.fonts.body,
    fontSize: theme.fontSizes.md,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xl,
  };

  const buttonRowStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
  };

  const confirmBtnStyle = {
    fontFamily: theme.fonts.body,
    fontSize: theme.fontSizes.md,
    background: theme.colors.borderGold,
    color: theme.colors.bgPage,
    border: 'none',
    borderRadius: theme.radius.md,
    padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
    cursor: 'pointer',
    transition: `background ${theme.transitions.fast}`,
  };

  const cancelBtnStyle = {
    fontFamily: theme.fonts.body,
    fontSize: theme.fontSizes.md,
    background: 'transparent',
    color: theme.colors.textPrimary,
    border: `1px solid ${theme.colors.borderBrown}`,
    borderRadius: theme.radius.md,
    padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
    cursor: 'pointer',
    transition: `background ${theme.transitions.fast}`,
  };

  return ReactDOM.createPortal(
    <div
      style={overlayStyle}
      role="dialog"
      aria-modal="true"
      aria-labelledby="alert-modal-title"
      onClick={handleOverlayClick}
    >
      <div ref={panelRef} style={panelStyle} onClick={(e) => e.stopPropagation()}>
        <div id="alert-modal-title" style={titleStyle}>{title}</div>
        <div style={messageStyle}>{message}</div>
        <div style={buttonRowStyle}>
          {cancelLabel && onCancel && (
            <button
              style={cancelBtnStyle}
              onClick={onCancel}
              onMouseEnter={(e) => { e.currentTarget.style.background = theme.colors.bgPanelDark; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {cancelLabel}
            </button>
          )}
          <button
            ref={confirmRef}
            style={confirmBtnStyle}
            onClick={() => { playSound('uiClick'); onConfirm?.(); }}
            onMouseEnter={(e) => { e.currentTarget.style.background = theme.colors.actionHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = theme.colors.borderGold; }}
            onMouseDown={(e) => { e.currentTarget.style.background = theme.colors.actionActive; }}
            onMouseUp={(e) => { e.currentTarget.style.background = theme.colors.actionHover; }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
