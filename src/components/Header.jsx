import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePortfolio } from '../context/PortfolioContext'
import Login from './Login'

const Header = ({ activeSection }) => {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const { isAuthenticated, logout } = useAuth()
  const { sectionOrder } = usePortfolio()

  const { portfolio } = usePortfolio()
  
  // Build nav items dynamically from sectionOrder with section numbers
  // Only include visible sections
  const getSectionNumber = (sectionId, visibleOrder) => {
    if (!visibleOrder || visibleOrder.length === 0) {
      return '00.'
    }
    const index = visibleOrder.indexOf(sectionId)
    if (index === -1) {
      return '00.'
    }
    const number = (index + 1).toString().padStart(2, '0')
    return `${number}.`
  }

  // Filter to only visible sections
  const visibleSectionOrder = sectionOrder?.filter(id => {
    return portfolio?.[id]?.visible !== false
  }) || []

  const navItems = visibleSectionOrder.length > 0
    ? visibleSectionOrder.map((id) => {
        const labels = {
          about: 'About',
          skills: 'Skills',
          experience: 'Experience',
          education: 'Education',
          achievements: 'Achievements',
          contact: 'Contact'
        }
        return {
          id,
          label: labels[id] || id.charAt(0).toUpperCase() + id.slice(1),
          number: getSectionNumber(id, visibleSectionOrder)
        }
      })
    : [
        { id: 'about', label: 'About', number: '01.' },
        { id: 'skills', label: 'Skills', number: '02.' },
        { id: 'experience', label: 'Experience', number: '03.' },
        { id: 'education', label: 'Education', number: '04.' },
        { id: 'achievements', label: 'Achievements', number: '05.' },
        { id: 'contact', label: 'Contact', number: '06.' },
      ]

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setIsMenuOpen(false)
    }
  }

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo" onClick={() => scrollToSection('hero')}>
            <span className="logo-text">&lt;DK /&gt;</span>
          </div>
          {visibleSectionOrder.length > 0 && (
            <nav className={`nav ${isMenuOpen ? 'nav-open' : ''}`}>
              <ul className="nav-list">
                {navItems.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => {
                        e.preventDefault()
                        scrollToSection(item.id)
                      }}
                      className={activeSection === item.id ? 'active' : ''}
                    >
                      <span className="nav-number">{item.number}</span>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          <div className="header-actions">
            {isAuthenticated ? (
              <>
                <button className="btn-admin" onClick={() => navigate('/admin')}>
                  Admin Panel
                </button>
                <button className="btn-admin" onClick={logout} style={{ marginLeft: '10px' }}>
                  Logout
                </button>
              </>
            ) : (
              <button className="btn-admin" onClick={() => setShowLogin(true)}>
                Admin
              </button>
            )}
            <button
              className="menu-toggle"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </div>
      {showLogin && (
        <Login
          onClose={() => {
            setShowLogin(false)
          }}
        />
      )}
    </header>
  )
}

export default Header

