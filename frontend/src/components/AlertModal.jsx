import { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { theme } from '../styles/theme';
import { playSound } from '../services/sound';

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

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

  return ReactDOM.createPortal(
    <div
      className="alert-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="alert-modal-title"
      onClick={handleOverlayClick}
      style={{ opacity: visible ? 1 : 0, transition: `opacity ${theme.transitions.normal}` }}
    >
      <div
        ref={panelRef}
        className="alert-panel"
        onClick={(e) => e.stopPropagation()}
        style={{ transform: visible ? 'scale(1)' : 'scale(0.92)', transition: `transform ${theme.transitions.normal}` }}
      >
        <div
          id="alert-modal-title"
          className={`alert-title alert-title--${variant}`}
        >
          {title}
        </div>
        <div className="alert-message">{message}</div>
        <div className="alert-btn-row">
          {cancelLabel && onCancel && (
            <button
              className="btn-cancel"
              onClick={onCancel}
              onMouseEnter={(e) => { e.currentTarget.style.background = theme.colors.bgPanelDark; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {cancelLabel}
            </button>
          )}
          <button
            ref={confirmRef}
            className="btn-confirm"
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
