import { createContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services/authService'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('pp360_user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch { localStorage.removeItem('pp360_user') }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await authService.login(email, password)
    // Support both unwrapped { user, token } and nested { data: { user, token } }
    const payload = data?.user && data?.token ? data : data?.data
    if (!payload?.user || !payload?.token) {
      throw new Error('Invalid login response')
    }
    setUser(payload.user)
    localStorage.setItem('pp360_user', JSON.stringify(payload.user))
    localStorage.setItem('pp360_token', payload.token)
    return payload
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('pp360_user')
    localStorage.removeItem('pp360_token')
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
