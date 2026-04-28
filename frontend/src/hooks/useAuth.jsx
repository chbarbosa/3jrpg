import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, sessionCheck, setToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(null);
  const [player, setPlayer] = useState(null);

  const logout = useCallback(() => {
    setTokenState(null);
    setToken(null);
    setPlayer(null);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await apiLogin(email, password);
    setTokenState(data.token);
    setToken(data.token);
    setPlayer({
      nickname: data.nickname,
      avatarId: data.avatarId,
      playerUuid: data.playerUuid,
    });
    return data;
  }, []);

  useEffect(() => {
    if (!token) return;
    sessionCheck()
      .then((data) => {
        if (data.timeout) {
          logout();
          window.location.href = '/gameover';
        }
      })
      .catch(logout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider value={{ token, player, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
