import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin, register as apiRegister, sessionCheck, setToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(null);
  const [player, setPlayer] = useState(null);
  const navigate = useNavigate();

  const logout = useCallback(() => {
    setTokenState(null);
    setToken(null);
    setPlayer(null);
  }, []);

  const storeSession = useCallback((data) => {
    setTokenState(data.token);
    setToken(data.token);
    setPlayer({ nickname: data.nickname, avatarId: data.avatarId, playerUuid: data.playerUuid });
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await apiLogin(email, password);
    storeSession(data);
    return data;
  }, [storeSession]);

  const register = useCallback(async (email, nickname, password) => {
    const data = await apiRegister(email, nickname, password);
    storeSession(data);
    return data;
  }, [storeSession]);

  // On mount: if token is already in memory, verify it hasn't timed out on the server.
  // In-memory JWT means this only fires when the AuthProvider remounts within a live SPA session.
  useEffect(() => {
    if (!token) return;
    sessionCheck()
      .then((data) => {
        if (data.timeout) {
          logout();
          navigate('/gameover', { state: { timeout: true, fightsSurvived: data.fightsSurvived } });
        }
      })
      .catch(logout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider value={{ token, player, login, register, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
