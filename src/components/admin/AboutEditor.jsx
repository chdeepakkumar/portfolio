import { useState, useEffect } from 'react'
import { usePortfolio } from '../../context/PortfolioContext'

const AboutEditor = ({ onNotification }) => {
  const { portfolio, updatePortfolio } = usePortfolio()
  const [paragraphs, setParagraphs] = useState([''])
  const [highlights, setHighlights] = useState([{ icon: '', text: '' }])

  const aboutData = portfolio?.about?.content || {}

  useEffect(() => {
    if (aboutData.paragraphs) {
      setParagraphs(aboutData.paragraphs.length > 0 ? aboutData.paragraphs : [''])
    }
    if (aboutData.highlights) {
      setHighlights(aboutData.highlights.length > 0 ? aboutData.highlights : [{ icon: '', text: '' }])
    }
  }, [aboutData])

  const handleParagraphChange = (index, value) => {
    const updated = [...paragraphs]
    updated[index] = value
    setParagraphs(updated)
  }

  const handleAddParagraph = () => {
    setParagraphs([...paragraphs, ''])
  }

  const handleRemoveParagraph = (index) => {
    if (paragraphs.length > 1) {
      setParagraphs(paragraphs.filter((_, i) => i !== index))
    }
  }

  const handleHighlightChange = (index, field, value) => {
    const updated = [...highlights]
    updated[index] = { ...updated[index], [field]: value }
    setHighlights(updated)
  }

  const handleAddHighlight = () => {
    setHighlights([...highlights, { icon: '', text: '' }])
  }

  const handleRemoveHighlight = (index) => {
    if (highlights.length > 1) {
      setHighlights(highlights.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const validParagraphs = paragraphs.filter(p => p.trim() !== '')
    const validHighlights = highlights.filter(h => h.icon.trim() !== '' && h.text.trim() !== '')

    if (validParagraphs.length === 0) {
      onNotification('Please add at least one paragraph', 'error')
      return
    }

    if (validHighlights.length === 0) {
      onNotification('Please add at least one highlight', 'error')
      return
    }

    try {
      await updatePortfolio({
        sections: {
          about: {
            content: {
              paragraphs: validParagraphs,
              highlights: validHighlights
            }
          }
        }
      })
      onNotification('About section updated successfully', 'success')
    } catch (error) {
      onNotification('Failed to update about section', 'error')
    }
  }

  return (
    <div>
      <h2>Edit About Section</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Update the about section content including paragraphs and highlights.
      </p>

      <form onSubmit={handleSubmit} className="admin-form">
        <div className="form-group">
          <label>Paragraphs</label>
          {paragraphs.map((paragraph, index) => (
            <div key={index} style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
              <textarea
                value={paragraph}
                onChange={(e) => handleParagraphChange(index, e.target.value)}
                placeholder={`Paragraph ${index + 1}...`}
                rows={3}
                style={{ 
                  flex: 1, 
                  color: '#ffffff', 
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
              {paragraphs.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveParagraph(index)}
                  className="btn-danger"
                  style={{ alignSelf: 'flex-start', padding: '0.5rem 1rem' }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddParagraph}
            className="btn-secondary"
            style={{ marginTop: '0.5rem' }}
          >
            + Add Paragraph
          </button>
        </div>

        <div className="form-group" style={{ marginTop: '2rem' }}>
          <label>Highlights</label>
          {highlights.map((highlight, index) => (
            <div key={index} style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                value={highlight.icon}
                onChange={(e) => handleHighlightChange(index, 'icon', e.target.value)}
                placeholder="Icon (emoji)"
                style={{ 
                  width: '80px', 
                  color: '#ffffff',
                  textAlign: 'center'
                }}
              />
              <input
                type="text"
                value={highlight.text}
                onChange={(e) => handleHighlightChange(index, 'text', e.target.value)}
                placeholder="Highlight text"
                style={{ 
                  flex: 1, 
                  color: '#ffffff'
                }}
              />
              {highlights.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveHighlight(index)}
                  className="btn-danger"
                  style={{ padding: '0.5rem 1rem' }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddHighlight}
            className="btn-secondary"
            style={{ marginTop: '0.5rem' }}
          >
            + Add Highlight
          </button>
        </div>

        <button type="submit" className="btn-primary">
          Save Changes
        </button>
      </form>
    </div>
  )
}

export default AboutEditor

