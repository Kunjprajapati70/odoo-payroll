import api from './api'

export const payslipService = {
  getAll: (params) => api.get('/payslips', { params }).then(r => r.data),
  getById: (id) => api.get(`/payslips/${id}`).then(r => r.data),
  downloadPdf: (id) => api.get(`/payslips/${id}/pdf`, { responseType: 'blob' }).then(r => r.data),
  sendEmail: (id) => api.post(`/payslips/${id}/send-email`).then(r => r.data),
}
