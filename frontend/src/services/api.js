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
    if (error.response?.status === 401) {
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

export default api;
