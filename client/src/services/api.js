import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pp360_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Unwrap { success, message, data } envelope and handle 401
api.interceptors.response.use(
  (response) => {
    // Keep blob downloads intact (PDF, etc.)
    if (response.config.responseType === 'blob') return response

    const body = response.data
    if (
      body &&
      typeof body === 'object' &&
      !Array.isArray(body) &&
      Object.prototype.hasOwnProperty.call(body, 'success') &&
      Object.prototype.hasOwnProperty.call(body, 'data')
    ) {
      response.data = body.data
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pp360_token')
      localStorage.removeItem('pp360_user')
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
