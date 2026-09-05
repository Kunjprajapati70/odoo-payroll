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
    setUser(data.user)
    localStorage.setItem('pp360_user', JSON.stringify(data.user))
    localStorage.setItem('pp360_token', data.token)
    return data
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
