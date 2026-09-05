import api from './api'

export const attendanceService = {
  getAll: (params) => api.get('/attendance', { params }).then(r => r.data),
  getById: (id) => api.get(`/attendance/${id}`).then(r => r.data),
  create: (data) => api.post('/attendance', data).then(r => r.data),
  update: (id, data) => api.put(`/attendance/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/attendance/${id}`).then(r => r.data),
  today: () => api.get('/attendance/today').then(r => r.data),
  checkIn: () => api.post('/attendance/check-in').then(r => r.data),
  checkOut: () => api.post('/attendance/check-out').then(r => r.data),
}
