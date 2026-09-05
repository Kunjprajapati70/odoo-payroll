import api from './api'

export const timeOffService = {
  // Types
  getTypes: (params) => api.get('/time-off/types', { params }).then(r => r.data),
  createType: (data) => api.post('/time-off/types', data).then(r => r.data),
  updateType: (id, data) => api.put(`/time-off/types/${id}`, data).then(r => r.data),
  deleteType: (id) => api.delete(`/time-off/types/${id}`).then(r => r.data),

  // Allocations
  getAllocations: (params) => api.get('/time-off/allocations', { params }).then(r => r.data),
  createAllocation: (data) => api.post('/time-off/allocations', data).then(r => r.data),
  updateAllocation: (id, data) => api.put(`/time-off/allocations/${id}`, data).then(r => r.data),

  // Requests
  getRequests: (params) => api.get('/time-off/requests', { params }).then(r => r.data),
  createRequest: (data) => api.post('/time-off/requests', data).then(r => r.data),
  approveRequest: (id) => api.put(`/time-off/requests/${id}/approve`).then(r => r.data),
  rejectRequest: (id, reason) => api.put(`/time-off/requests/${id}/reject`, { reason }).then(r => r.data),
}
