import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { portfolioAPI } from '../utils/auth'
import { useAuth } from './AuthContext'

const PortfolioContext = createContext(null)

export const usePortfolio = () => {
  const context = useContext(PortfolioContext)
  if (!context) {
    throw new Error('usePortfolio must be used within PortfolioProvider')
  }
  return context
}

export const PortfolioProvider = ({ children }) => {
  const [portfolio, setPortfolio] = useState(null)
  const [sectionOrder, setSectionOrder] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { isAuthenticated } = useAuth()

  const loadPortfolio = useCallback(async (useAdminEndpoint = false) => {
    try {
      setLoading(true)
      setError(null)
      // Use admin endpoint if authenticated to get all sections (including invisible)
      const data = useAdminEndpoint && isAuthenticated
        ? await portfolioAPI.getAdminPortfolio()
        : await portfolioAPI.getPortfolio()
      setPortfolio(data.sections)
      setSectionOrder(data.sectionOrder)
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load portfolio'
      setError(errorMessage)
      console.error('Error loading portfolio:', err)
      
      // More detailed error logging
      if (err.response) {
        // Server responded with error
        console.error('Error details:', {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data,
          url: err.config?.url
        })
      } else if (err.request) {
        // Request made but no response (server not running or network issue)
        const fullUrl = err.config ? `${err.config.baseURL || ''}${err.config.url || ''}` : 'unknown'
        console.error('Network error - server may not be running:', {
          fullUrl: fullUrl,
          baseURL: err.config?.baseURL,
          url: err.config?.url,
          errorMessage: err.message,
          errorCode: err.code,
          helpText: 'No response from server. Make sure the backend server is running on port 3001.'
        })
      } else {
        // Something else happened
        console.error('Error setting up request:', err.message)
      }
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    loadPortfolio(isAuthenticated)
  }, [isAuthenticated, loadPortfolio])

  const updatePortfolio = async (updates) => {
    if (!isAuthenticated) {
      throw new Error('Not authenticated')
    }

    try {
      const response = await portfolioAPI.updatePortfolio(updates)
      // Reload portfolio to get updated data (use admin endpoint since we're authenticated)
      await loadPortfolio(true)
      return { success: true, data: response }
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to update portfolio')
    }
  }

  const updateSectionOrder = async (newOrder) => {
    if (!isAuthenticated) {
      throw new Error('Not authenticated')
    }

    try {
      await portfolioAPI.updateSectionOrder(newOrder)
      setSectionOrder(newOrder)
      return { success: true }
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to update section order')
    }
  }

  const value = {
    portfolio,
    sectionOrder,
    loading,
    error,
    updatePortfolio,
    updateSectionOrder,
    reloadPortfolio: loadPortfolio
  }

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>
}

