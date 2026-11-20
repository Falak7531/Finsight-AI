import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import * as authService from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const authRevision = useRef(0)

  const refreshUser = useCallback(async () => {
    const revision = ++authRevision.current
    try {
      const res = await authService.getCurrentUser()
      if (revision === authRevision.current) setUser(res?.user || null)
    } catch {
      if (revision === authRevision.current) setUser(null)
    } finally {
      if (revision === authRevision.current) setAuthLoading(false)
    }
  }, [])

  useEffect(() => {
    // refreshUser only updates state after the session request settles.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshUser()
    return () => { authRevision.current += 1 }
  }, [refreshUser])

  const authenticate = async (action, payload) => {
    const revision = ++authRevision.current
    try {
      const res = await action(payload)
      if (revision === authRevision.current) setUser(res.user)
      return res
    } finally {
      if (revision === authRevision.current) setAuthLoading(false)
    }
  }

  const login = (credentials) => authenticate(authService.login, credentials)
  const register = (details) => authenticate(authService.register, details)

  const logout = async () => {
    ++authRevision.current
    try {
      await authService.logout()
    } finally {
      setUser(null)
      setAuthLoading(false)
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
