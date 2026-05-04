import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import AlertModal from '../components/AlertModal';
import { theme } from '../styles/theme';

const pageStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: theme.colors.bgPage,
};

const headingStyle = {
  fontFamily: theme.fonts.header,
  color: theme.colors.textHeader,
  fontSize: theme.fontSizes.xxl,
};

export default function GameOverPage() {
  const { state } = useLocation();
  const [timeoutDismissed, setTimeoutDismissed] = useState(false);

  return (
    <div style={pageStyle}>
      <h1 style={headingStyle}>Game Over</h1>
      <AlertModal
        isOpen={!!state?.timeout && !timeoutDismissed}
        title="Session Expired"
        message="Your session expired after 1 hour. Run lost."
        variant="info"
        confirmLabel="OK"
        onConfirm={() => setTimeoutDismissed(true)}
      />
    </div>
  );
}
