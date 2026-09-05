import api from './api'

export const payrunService = {
  getAll: (params) => api.get('/payruns', { params }).then(r => r.data),
  getById: (id) => api.get(`/payruns/${id}`).then(r => r.data),
  create: (data) => api.post('/payruns', data).then(r => r.data),
  compute: (id) => api.post(`/payruns/${id}/compute`).then(r => r.data),
  approve: (id) => api.put(`/payruns/${id}/approve`).then(r => r.data),
  markPaid: (id) => api.put(`/payruns/${id}/mark-paid`).then(r => r.data),
  sendPayslips: (id) => api.post(`/payruns/${id}/send-payslips`).then(r => r.data),
  cancel: (id) => api.put(`/payruns/${id}/cancel`).then(r => r.data),
}
