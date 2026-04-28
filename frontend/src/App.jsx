import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import MenuPage from './pages/MenuPage';
import SelectionPage from './pages/SelectionPage';
import BattlePage from './pages/BattlePage';
import PrepPage from './pages/PrepPage';
import GameOverPage from './pages/GameOverPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<MenuPage />} />
          <Route path="/select" element={<ProtectedRoute><SelectionPage /></ProtectedRoute>} />
          <Route path="/battle" element={<ProtectedRoute><BattlePage /></ProtectedRoute>} />
          <Route path="/prep" element={<ProtectedRoute><PrepPage /></ProtectedRoute>} />
          <Route path="/gameover" element={<ProtectedRoute><GameOverPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
