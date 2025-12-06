import { usePortfolio } from '../context/PortfolioContext'

const Hero = () => {
  const { portfolio } = usePortfolio()
  
  // Check if sections are visible
  const isContactVisible = portfolio?.contact?.visible !== false
  const isExperienceVisible = portfolio?.experience?.visible !== false
  
  // Get hero content from portfolio or use defaults
  const heroData = portfolio?.hero?.content || {}
  const greeting = heroData.greeting || "Hello, I'm"
  const name = heroData.name || 'Deepak Kumar CH'
  const title = heroData.title || 'Software Engineer'
  const description = heroData.description || 'Building scalable solutions with Java, Go, and modern cloud technologies.\nPassionate about creating high-performance software and solving complex problems.'
  
  // Split description by line breaks for multiple paragraphs
  const descriptionParagraphs = description.split('\n').filter(p => p.trim() !== '')
  
  // Handle resume download
  const handleDownloadResume = async (e) => {
    e.preventDefault()
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
      const response = await fetch(`${API_BASE_URL}/portfolio/resume.pdf`)
      
      // Check if response is OK
      if (!response.ok) {
        // Try to get error message
        let errorMessage = 'Failed to download resume'
        try {
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } else {
            errorMessage = `Server returned ${response.status}: ${response.statusText}`
          }
        } catch (e) {
          errorMessage = `Server returned ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      // Verify content type
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/pdf')) {
        // Still try to download, but warn
      }
      
      const blob = await response.blob()
      
      // Verify blob is not empty
      if (blob.size === 0) {
        throw new Error('Empty file received')
      }
      
      // Verify it's actually a PDF by checking blob type
      if (blob.type && !blob.type.includes('pdf')) {
      }
      
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      // Get filename from response headers or use default
      const contentDisposition = response.headers.get('content-disposition')
      let filename = 'Resume.pdf'
      if (contentDisposition) {
        // Try to extract filename from Content-Disposition header
        // Handles both quoted and unquoted filenames
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i)
        if (filenameMatch) {
          filename = filenameMatch[1].replace(/['"]/g, '')
          // Decode URI-encoded filename if present
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
      
      // Clean up after a short delay
      setTimeout(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }, 100)
    } catch (error) {
      console.error('Error downloading resume:', error)
      alert(`Failed to download resume: ${error.message}`)
    }
  }
  
  return (
    <section id="hero" className="hero">
      <div className="container">
        <div className="hero-content">
          <div className="hero-greeting">
            <span className="terminal-prompt">$</span>
            <span className="typing-text">{greeting}</span>
          </div>
          <h1 className="hero-name">
            <span className="name-highlight">{name}</span>
          </h1>
          <h2 className="hero-title">{title}</h2>
          <div className="hero-description">
            {descriptionParagraphs.map((para, index) => (
              <p key={index}>{para}</p>
            ))}
          </div>
          <div className="hero-cta">
            {isExperienceVisible && (
              <a href="#experience" className="btn btn-geek">
                <span className="btn-prefix">~</span>
                <span className="btn-text">View My Work</span>
                <span className="btn-suffix">/</span>
              </a>
            )}
            <a 
              href="#" 
              onClick={handleDownloadResume}
              className="btn btn-geek"
            >
              <span className="btn-prefix">&gt;</span>
              <span className="btn-text">Download Resume</span>
              <span className="btn-suffix">.pdf</span>
            </a>
            {isContactVisible && (
              <a href="#contact" className="btn btn-geek">
                <span className="btn-prefix">$</span>
                <span className="btn-text">Get in Touch</span>
                <span className="btn-suffix">()</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero

