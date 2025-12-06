import { useState, useEffect } from 'react'
import { usePortfolio } from '../../context/PortfolioContext'

const HeroEditor = ({ onNotification }) => {
  const { portfolio, updatePortfolio } = usePortfolio()
  const [formData, setFormData] = useState({
    greeting: "Hello, I'm",
    name: 'Deepak Kumar CH',
    title: 'Software Engineer',
    description: 'Building scalable solutions with Java, Go, and modern cloud technologies.\nPassionate about creating high-performance software and solving complex problems.'
  })

  const heroData = portfolio?.hero?.content || {}

  useEffect(() => {
    if (heroData) {
      setFormData({
        greeting: heroData.greeting || "Hello, I'm",
        name: heroData.name || 'Deepak Kumar CH',
        title: heroData.title || 'Software Engineer',
        description: heroData.description || 'Building scalable solutions with Java, Go, and modern cloud technologies.\nPassionate about creating high-performance software and solving complex problems.'
      })
    }
  }, [heroData])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.title.trim() || !formData.description.trim()) {
      onNotification('Please fill in all required fields', 'error')
      return
    }

    try {
      await updatePortfolio({
        sections: {
          hero: {
            content: {
              greeting: formData.greeting,
              name: formData.name,
              title: formData.title,
              description: formData.description
            }
          }
        }
      })
      onNotification('Hero section updated successfully', 'success')
    } catch (error) {
      onNotification('Failed to update hero section', 'error')
    }
  }

  return (
    <div>
      <h2>Edit Hero Section</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Update the main hero section that appears at the top of your portfolio.
      </p>

      <form onSubmit={handleSubmit} className="admin-form">
        <div className="form-group">
          <label htmlFor="greeting">Greeting Text</label>
          <input
            id="greeting"
            type="text"
            value={formData.greeting}
            onChange={(e) => setFormData({ ...formData, greeting: e.target.value })}
            placeholder="Hello, I'm"
            style={{ color: '#ffffff' }}
          />
        </div>

        <div className="form-group">
          <label htmlFor="name">Name *</label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Your Name"
            required
            style={{ color: '#ffffff' }}
          />
        </div>

        <div className="form-group">
          <label htmlFor="title">Title/Profession *</label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Software Engineer"
            required
            style={{ color: '#ffffff' }}
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Your professional description..."
            required
            rows={4}
            style={{ color: '#ffffff', fontFamily: 'inherit' }}
          />
          <small style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
            Use line breaks to separate paragraphs
          </small>
        </div>

        <button type="submit" className="btn-primary">
          Save Changes
        </button>
      </form>
    </div>
  )
}

export default HeroEditor

