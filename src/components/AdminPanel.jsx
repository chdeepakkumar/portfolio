import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePortfolio } from '../context/PortfolioContext'
import SectionManager from './admin/SectionManager'
import HeroEditor from './admin/HeroEditor'
import AboutEditor from './admin/AboutEditor'
import ExperienceEditor from './admin/ExperienceEditor'
import SkillsEditor from './admin/SkillsEditor'
import EducationEditor from './admin/EducationEditor'
import AchievementsEditor from './admin/AchievementsEditor'
import ContactEditor from './admin/ContactEditor'
import KnowledgeFilesEditor from './admin/KnowledgeFilesEditor'
import ResumeEditor from './admin/ResumeEditor'
import './AdminPanel.css'

const AdminPanel = () => {
  const navigate = useNavigate()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { portfolio, loading: portfolioLoading } = usePortfolio()
  const [activeTab, setActiveTab] = useState('sections')
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, authLoading, navigate])

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  // Handle resume generation (from portfolio data)
  const handleGenerateResume = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
      const accessToken = localStorage.getItem('accessToken')
      
      if (!accessToken) {
        showNotification('Please log in to generate resume', 'error')
        return
      }
      
      const response = await fetch(`${API_BASE_URL}/portfolio/generate-resume.pdf`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to generate resume'
        try {
          if (response.status === 401 || response.status === 403) {
            errorMessage = 'Authentication required. Please log in again.'
          } else {
            const errorData = await response.json().catch(() => ({}))
            errorMessage = errorData.error || errorMessage
          }
        } catch (e) {
          errorMessage = `Server returned ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      // Verify content type
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/pdf')) {
        throw new Error('Invalid file type received')
      }
      
      const blob = await response.blob()
      
      if (blob.size === 0) {
        throw new Error('Empty file received')
      }
      
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      // Get filename from response headers or use default
      const contentDisposition = response.headers.get('content-disposition')
      let filename = 'Resume.pdf'
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i)
        if (filenameMatch) {
          filename = filenameMatch[1].replace(/['"]/g, '')
          try {
            filename = decodeURIComponent(filename)
          } catch (e) {
            // If decoding fails, use as is
          }
        }
      }
      
      link.download = filename
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      
      setTimeout(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }, 100)
      
      showNotification('Resume generated and downloaded successfully', 'success')
    } catch (error) {
      console.error('Error generating resume:', error)
      showNotification(`Failed to generate resume: ${error.message}`, 'error')
    }
  }

  if (authLoading || portfolioLoading || !isAuthenticated) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  const tabs = [
    { id: 'sections', label: 'Sections' },
    { id: 'hero', label: 'Hero' },
    { id: 'about', label: 'About' },
    { id: 'experience', label: 'Experience' },
    { id: 'skills', label: 'Skills' },
    { id: 'education', label: 'Education' },
    { id: 'achievements', label: 'Achievements' },
    { id: 'contact', label: 'Contact' },
    { id: 'resume', label: 'Resume' },
    { id: 'knowledge', label: 'Knowledge Files' }
  ]

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Portfolio Admin Panel</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="btn-primary" onClick={handleGenerateResume}>
            Generate Resume
          </button>
          <button className="btn-back" onClick={() => navigate('/')}>
            ← Back to Portfolio
          </button>
        </div>
      </div>

      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="admin-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="admin-content">
        {activeTab === 'sections' && <SectionManager onNotification={showNotification} />}
        {activeTab === 'hero' && <HeroEditor onNotification={showNotification} />}
        {activeTab === 'about' && <AboutEditor onNotification={showNotification} />}
        {activeTab === 'experience' && <ExperienceEditor onNotification={showNotification} />}
        {activeTab === 'skills' && <SkillsEditor onNotification={showNotification} />}
        {activeTab === 'education' && <EducationEditor onNotification={showNotification} />}
        {activeTab === 'achievements' && <AchievementsEditor onNotification={showNotification} />}
        {activeTab === 'contact' && <ContactEditor onNotification={showNotification} />}
        {activeTab === 'resume' && <ResumeEditor onNotification={showNotification} />}
        {activeTab === 'knowledge' && <KnowledgeFilesEditor onNotification={showNotification} />}
      </div>
    </div>
  )
}

export default AdminPanel

