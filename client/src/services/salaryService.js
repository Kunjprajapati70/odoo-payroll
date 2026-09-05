import api from './api'

export const salaryService = {
  // Structures
  getStructures: (params) => api.get('/salary-structures', { params }).then(r => r.data),
  getStructureById: (id) => api.get(`/salary-structures/${id}`).then(r => r.data),
  createStructure: (data) => api.post('/salary-structures', data).then(r => r.data),
  updateStructure: (id, data) => api.put(`/salary-structures/${id}`, data).then(r => r.data),
  deleteStructure: (id) => api.delete(`/salary-structures/${id}`).then(r => r.data),

  // Rules
  getRules: (params) => api.get('/salary-rules', { params }).then(r => r.data),
  getRuleById: (id) => api.get(`/salary-rules/${id}`).then(r => r.data),
  createRule: (data) => api.post('/salary-rules', data).then(r => r.data),
  updateRule: (id, data) => api.put(`/salary-rules/${id}`, data).then(r => r.data),
  deleteRule: (id) => api.delete(`/salary-rules/${id}`).then(r => r.data),
}
