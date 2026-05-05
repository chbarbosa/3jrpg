import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import NavBar from './components/NavBar';
import MenuPage from './pages/MenuPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SelectionPage from './pages/SelectionPage';
import BattlePage from './pages/BattlePage';
import PrepPage from './pages/PrepPage';
import GameOverPage from './pages/GameOverPage';
import SeasonPage from './pages/SeasonPage';
import ProfilePage from './pages/ProfilePage';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function PublicOnlyRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/select" replace /> : children;
}

function AppRoutes() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<MenuPage />} />
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
        <Route path="/select" element={<ProtectedRoute><SelectionPage /></ProtectedRoute>} />
        <Route path="/battle" element={<ProtectedRoute><BattlePage /></ProtectedRoute>} />
        <Route path="/prep" element={<ProtectedRoute><PrepPage /></ProtectedRoute>} />
        <Route path="/gameover" element={<GameOverPage />} />
        <Route path="/season" element={<ProtectedRoute><SeasonPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
