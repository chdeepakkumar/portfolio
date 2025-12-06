import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'


const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken
          })
          const { accessToken } = response.data
          localStorage.setItem('accessToken', accessToken)
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export const authAPI = {
  requestOTP: async (password) => {
    const response = await api.post('/auth/request-otp', { password })
    return response.data
  },
  login: async (otp) => {
    const response = await api.post('/auth/login', { otp })
    return response.data
  },
  refresh: async (refreshToken) => {
    const response = await api.post('/auth/refresh', { refreshToken })
    return response.data
  }
}

export const portfolioAPI = {
  getPortfolio: async () => {
    const response = await api.get('/portfolio')
    return response.data
  },
  getAdminPortfolio: async () => {
    const response = await api.get('/portfolio/admin')
    return response.data
  },
  updatePortfolio: async (updates) => {
    const response = await api.put('/portfolio', updates)
    return response.data
  },
  getSectionOrder: async () => {
    const response = await api.get('/portfolio/sections')
    return response.data
  },
  updateSectionOrder: async (sectionOrder) => {
    const response = await api.put('/portfolio/sections', { sectionOrder })
    return response.data
  },
  getKnowledgeFiles: async () => {
    const response = await api.get('/portfolio/knowledge-files')
    return response.data
  },
  getKnowledgeFile: async (filename) => {
    const response = await api.get(`/portfolio/knowledge-files/${filename}`)
    return response.data
  },
  uploadKnowledgeFile: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/portfolio/knowledge-files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },
  deleteKnowledgeFile: async (filename) => {
    const response = await api.delete(`/portfolio/knowledge-files/${filename}`)
    return response.data
  },
  listResumes: async () => {
    const response = await api.get('/portfolio/resumes')
    return response.data
  },
  uploadResume: async (file) => {
    const formData = new FormData()
    formData.append('resume', file)
    const response = await api.post('/portfolio/resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },
  setActiveResume: async (filename) => {
    const response = await api.put('/portfolio/resume/active', { filename })
    return response.data
  },
  deleteResume: async (filename) => {
    const response = await api.delete(`/portfolio/resume/${filename}`)
    return response.data
  }
}

export default api

