import { createContext, useState, useCallback } from 'react'

export const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <AppContext.Provider value={{ toasts, addToast, removeToast, sidebarOpen, setSidebarOpen }}>
      {children}
    </AppContext.Provider>
  )
}
