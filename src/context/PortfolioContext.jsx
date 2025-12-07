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

  const loadPortfolio = useCallback(async (useAdminEndpoint = false, skipLoadingState = false) => {
    try {
      if (!skipLoadingState) {
        setLoading(true)
      }
      setError(null)
      // Use admin endpoint if authenticated to get all sections (including invisible)
      const data = useAdminEndpoint && isAuthenticated
        ? await portfolioAPI.getAdminPortfolio()
        : await portfolioAPI.getPortfolio()
      
      console.log('PortfolioContext - Received data:', {
        hasSections: !!data.sections,
        sectionsKeys: data.sections ? Object.keys(data.sections) : [],
        hasSectionOrder: !!data.sectionOrder,
        sectionOrderLength: data.sectionOrder?.length || 0,
        sectionOrder: data.sectionOrder,
        useAdminEndpoint,
        isAuthenticated
      })
      
      if (!data.sections) {
        console.warn('PortfolioContext - No sections in response, setting empty object')
        setPortfolio({})
      } else {
        // Log section visibilities for debugging
        const sectionVisibilities = Object.keys(data.sections).reduce((acc, key) => {
          acc[key] = data.sections[key]?.visible
          return acc
        }, {})
        console.log('PortfolioContext - Section visibilities after load:', sectionVisibilities)
        setPortfolio(data.sections)
      }
      
      if (!data.sectionOrder) {
        console.warn('PortfolioContext - No sectionOrder in response, setting empty array')
        setSectionOrder([])
      } else {
        setSectionOrder(data.sectionOrder)
      }
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
      
      // Set empty state on error to prevent infinite loading
      setPortfolio({})
      setSectionOrder([])
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
      console.log('PortfolioContext - Updating portfolio with:', updates)
      const response = await portfolioAPI.updatePortfolio(updates)
      console.log('PortfolioContext - Update response:', response)
      
      // Reload portfolio to get updated data (use admin endpoint since we're authenticated)
      // Skip loading state to prevent UI flicker during updates
      await loadPortfolio(true, true)
      return { success: true, data: response }
    } catch (err) {
      console.error('PortfolioContext - Update error:', err)
      throw new Error(err.response?.data?.error || 'Failed to update portfolio')
    }
  }

  const updateSectionOrder = async (newOrder) => {
    if (!isAuthenticated) {
      throw new Error('Not authenticated')
    }

    try {
      await portfolioAPI.updateSectionOrder(newOrder)
      // Update local state immediately
      setSectionOrder(newOrder)
      // Also reload to ensure consistency (skip loading state to prevent UI flicker)
      await loadPortfolio(true, true)
      return { success: true }
    } catch (err) {
      console.error('Error updating section order:', err)
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

