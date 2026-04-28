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

export default function PrepPage() {
  return (
    <div style={pageStyle}>
      <h1 style={headingStyle}>Prep</h1>
    </div>
  );
}
