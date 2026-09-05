import api from './api'

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats').then(r => r.data),
  getSalaryChart: (params) => api.get('/dashboard/salary-chart', { params }).then(r => r.data),
  getAttendanceChart: (params) => api.get('/dashboard/attendance-chart', { params }).then(r => r.data),
  getDepartmentChart: () => api.get('/dashboard/department-chart').then(r => r.data),
  getAlerts: () => api.get('/dashboard/alerts').then(r => r.data),
}
