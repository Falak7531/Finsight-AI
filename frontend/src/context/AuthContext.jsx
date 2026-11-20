import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import * as authService from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const res = await authService.getCurrentUser()
      setUser(res?.user || null)
    } catch {
      setUser(null)
    } finally {
      setAuthLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = async (credentials) => {
    const res = await authService.login(credentials)
    setUser(res.user)
    return res
  }

  const register = async (details) => {
    const res = await authService.register(details)
    setUser(res.user)
    return res
  }

  const logout = async () => {
    try {
      await authService.logout()
    } finally {
      setUser(null)
    }
  }

  const updateUserProfile = async (payload) => {
    const res = await authService.updateProfile(payload)
    if (res?.user) setUser(res.user)
    return res
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        authLoading,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
        refreshUser,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function ProtectedRoute({ children }) {
  const { isAuthenticated, authLoading } = useAuth()
  const location = useLocation()

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050605] text-[#F5F7F3]">
        <div className="flex flex-col items-center gap-3">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#20251F] border-t-[#8DFF00]" />
          <p className="font-mono text-xs text-[#A0A69E]">
            Verifying session...
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
