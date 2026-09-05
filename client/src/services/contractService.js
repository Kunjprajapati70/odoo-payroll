import api from './api'

export const contractService = {
  getAll: (params) => api.get('/contracts', { params }).then(r => r.data),
  getById: (id) => api.get(`/contracts/${id}`).then(r => r.data),
  create: (data) => api.post('/contracts', data).then(r => r.data),
  update: (id, data) => api.put(`/contracts/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/contracts/${id}`).then(r => r.data),
}
