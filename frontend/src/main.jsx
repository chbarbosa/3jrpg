import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './app.css';
import App from './App.jsx';
import { loadSounds } from './services/sound';

function handleFirstInteraction() {
  loadSounds();
  document.removeEventListener('click', handleFirstInteraction, { once: true });
}
document.addEventListener('click', handleFirstInteraction, { once: true });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
