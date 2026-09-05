import api from './api'

export const employeeService = {
  getAll: (params) => api.get('/employees', { params }).then(r => r.data),
  getById: (id) => api.get(`/employees/${id}`).then(r => r.data),
  create: (data) => api.post('/employees', data).then(r => r.data),
  update: (id, data) => api.put(`/employees/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/employees/${id}`).then(r => r.data),
}
