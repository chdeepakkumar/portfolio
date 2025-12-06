import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Hero from './components/Hero'
import About from './components/About'
import Skills from './components/Skills'
import Experience from './components/Experience'
import Education from './components/Education'
import Achievements from './components/Achievements'
import Contact from './components/Contact'
import Footer from './components/Footer'
import Chatbot from './components/Chatbot'
import AdminPanel from './components/AdminPanel'
import { usePortfolio } from './context/PortfolioContext'

const PortfolioContent = () => {
  const [activeSection, setActiveSection] = useState('')
  const { sectionOrder, portfolio, loading } = usePortfolio()
  
  // Filter sectionOrder to only include visible sections (safety check)
  const visibleSectionOrder = sectionOrder?.filter(sectionId => {
    return portfolio?.[sectionId]?.visible !== false
  }) || []

  useEffect(() => {
    if (!visibleSectionOrder || visibleSectionOrder.length === 0) return

    const handleScroll = () => {
      const sections = ['hero', ...visibleSectionOrder]
      const scrollPosition = window.scrollY + 100

      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [visibleSectionOrder])

  const sectionComponents = {
    about: <About />,
    skills: <Skills />,
    experience: <Experience />,
    education: <Education />,
    achievements: <Achievements />,
    contact: <Contact />
  }

  // Show loading screen only when data is actually loading
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      </div>
    )
  }

  // Show message when all sections are disabled
  if (!visibleSectionOrder || visibleSectionOrder.length === 0) {
    return (
      <>
        <Header activeSection={activeSection} />
        <main>
          <Hero />
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '60vh', 
            flexDirection: 'column', 
            gap: '1rem',
            padding: '4rem 2rem',
            textAlign: 'center',
            background: 'var(--bg-primary)'
          }}>
            <div style={{ 
              fontSize: '3rem', 
              marginBottom: '1rem',
              opacity: 0.5
            }}>📭</div>
            <h2 style={{ 
              color: 'var(--text-primary)', 
              fontSize: '1.5rem',
              marginBottom: '0.5rem'
            }}>
              No Content Available
            </h2>
            <p style={{ 
              color: 'var(--text-secondary)', 
              fontSize: '1rem',
              maxWidth: '500px',
              lineHeight: '1.6'
            }}>
              All portfolio sections are currently hidden. Please enable at least one section to view content.
            </p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header activeSection={activeSection} />
      <main>
        <Hero />
        {visibleSectionOrder.map((sectionId, index) => {
          const Component = sectionComponents[sectionId]
          // Uniform background for all sections
          return Component ? (
            <div 
              key={sectionId} 
              className="section-wrapper"
              data-section-index={index}
            >
              {Component}
            </div>
          ) : null
        })}
      </main>
      <Footer />
      <Chatbot />
    </>
  )
}

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="*" element={<PortfolioContent />} />
      </Routes>
    </div>
  )
}

export default App

