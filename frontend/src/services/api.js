import axios from 'axios';

let _token = null;

export const setToken = (token) => {
  _token = token;
};

const api = axios.create({
  baseURL: 'http://localhost:8080',
});

api.interceptors.request.use((config) => {
  if (_token) {
    config.headers.Authorization = `Bearer ${_token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && _token) {
      _token = null;
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const register = (email, nickname, password) =>
  api.post('/auth/register', { email, nickname, password }).then((r) => r.data);

export const login = (email, password) =>
  api.post('/auth/login', { email, password }).then((r) => r.data);

export const sessionCheck = () =>
  api.get('/auth/session-check').then((r) => r.data);

// ── Run / Battle ──────────────────────────────────────────────────────────────

export const startRun = (heroes) =>
  api.post('/api/run/start', { heroes }).then((r) => r.data);

export const performAction = (runUuid, actionType, actorId, targetId, skillId, spellId, itemId) =>
  api.post('/api/run/action', { runUuid, actionType, actorId, targetId, skillId, spellId, itemId }).then((r) => r.data);

export const nextFight = (runUuid) =>
  api.post('/api/run/fight/next', null, { params: { runUuid } }).then((r) => r.data);

export const startPrep = (runUuid) =>
  api.post('/api/run/prep', null, { params: { runUuid } }).then((r) => r.data);

export const assignLoot = (runUuid, recipientHeroId) =>
  api.post('/api/run/prep/assign-loot', { runUuid, recipientHeroId }).then((r) => r.data);

export const prepAction = (runUuid, heroId, actionType, itemId, targetHeroId, equipSlot = null, itemUuid = null) =>
  api.post('/api/run/prep/action', { runUuid, heroId, actionType, itemId, targetHeroId, equipSlot, itemUuid }).then((r) => r.data);

export const giveUp = (runUuid) =>
  api.post('/api/run/giveup', { runUuid }).then((r) => r.data);

export const restart = (runUuid) =>
  api.post('/api/run/restart', { runUuid }).then((r) => r.data);

// ── Run history ───────────────────────────────────────────────────────────────

export const getActiveRun = () =>
  api.get('/api/run/active').then((r) => r.data).catch((err) => {
    if (err.response?.status === 204) return null;
    throw err;
  });

export const getRunHistory = (page = 0) =>
  api.get('/api/run/history', { params: { page, size: 10 } }).then((r) => r.data);

export const getRunEvents = (runUuid) =>
  api.get(`/api/run/${runUuid}/events`).then((r) => r.data);

// ── Player profile ────────────────────────────────────────────────────────────

export const getProfile = () =>
  api.get('/api/player/profile').then((r) => r.data);

export const updateProfile = (data) =>
  api.put('/api/player/profile', data).then((r) => r.data);

export const getAvatars = () =>
  api.get('/api/player/avatars').then((r) => r.data);

// ── Season & leaderboard ──────────────────────────────────────────────────────

export const getCurrentSeason = () =>
  api.get('/api/season/current').then((r) => r.data);

export const getLeaderboard = (page = 0, size = 20) =>
  api.get('/api/season/leaderboard', { params: { page, size } }).then((r) => r.data);

export const getSeasonHistory = () =>
  api.get('/api/season/history').then((r) => r.data);

export const getPlayerSeasonRank = () =>
  api.get('/api/player/season-rank').then((r) => r.data);

export default api;
