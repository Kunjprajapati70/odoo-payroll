import api from './api'

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }).then(r => r.data),
  logout: () => api.post('/auth/logout').then(r => r.data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }).then(r => r.data),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }).then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
}
