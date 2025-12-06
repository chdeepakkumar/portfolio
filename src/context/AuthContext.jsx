import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../utils/auth'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check if user is logged in on mount
    const accessToken = localStorage.getItem('accessToken')
    const refreshToken = localStorage.getItem('refreshToken')
    
    if (accessToken && refreshToken) {
      // Try to refresh token to verify it's still valid
      authAPI.refresh(refreshToken)
        .then((data) => {
          localStorage.setItem('accessToken', data.accessToken)
          setIsAuthenticated(true)
          // Get user info from token (basic implementation)
          try {
            const payload = JSON.parse(atob(accessToken.split('.')[1]))
            setUser({ username: payload.username, id: payload.userId })
          } catch (e) {
            console.error('Error parsing token:', e)
          }
        })
        .catch(() => {
          // Token invalid, clear storage
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          setIsAuthenticated(false)
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (otp) => {
    try {
      const data = await authAPI.login(otp)
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      setUser(data.user)
      setIsAuthenticated(true)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
    setIsAuthenticated(false)
  }

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

