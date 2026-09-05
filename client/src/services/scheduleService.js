import api from './api'

export const scheduleService = {
  getAll: (params) => api.get('/schedules', { params }).then(r => r.data),
  getById: (id) => api.get(`/schedules/${id}`).then(r => r.data),
  create: (data) => api.post('/schedules', data).then(r => r.data),
  update: (id, data) => api.put(`/schedules/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/schedules/${id}`).then(r => r.data),
}
