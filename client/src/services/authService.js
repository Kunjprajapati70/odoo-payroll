import api from './api'

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }).then(r => r.data),
  logout: () => api.post('/auth/logout').then(r => r.data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }).then(r => r.data),
  resetPassword: (token, password, email) =>
    api.post('/auth/reset-password', { token, password, email }).then(r => r.data),
  changePassword: (currentPassword, newPassword) =>
    api.post('/auth/change-password', { currentPassword, newPassword }).then(r => r.data),
  updateProfile: (data) => api.put('/auth/profile', data).then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
}
