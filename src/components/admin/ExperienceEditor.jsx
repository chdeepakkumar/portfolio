import { useState } from 'react'
import { usePortfolio } from '../../context/PortfolioContext'

const ExperienceEditor = ({ onNotification }) => {
  const { portfolio, updatePortfolio } = usePortfolio()
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    location: '',
    period: '',
    description: '',
    achievements: ['']
  })

  const experiences = portfolio?.experience?.content?.experiences || []

  const handleAdd = () => {
    setFormData({
      company: '',
      role: '',
      location: '',
      period: '',
      description: '',
      achievements: ['']
    })
    setEditingId(null)
    setShowForm(true)
  }

  const handleEdit = (exp) => {
    setFormData({
      company: exp.company,
      role: exp.role,
      location: exp.location,
      period: exp.period,
      description: exp.description,
      achievements: exp.achievements.length > 0 ? exp.achievements : ['']
    })
    setEditingId(exp.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this experience?')) return

    const updated = experiences.filter((exp) => exp.id !== id)
    try {
      await updatePortfolio({
        sections: {
          experience: {
            content: {
              experiences: updated
            }
          }
        }
      })
      onNotification('Experience deleted successfully', 'success')
    } catch (error) {
      onNotification('Failed to delete experience', 'error')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const achievementList = formData.achievements.filter((a) => a.trim() !== '')
    if (achievementList.length === 0) {
      onNotification('Please add at least one achievement', 'error')
      return
    }

    const experienceData = {
      ...formData,
      achievements: achievementList
    }

    try {
      let updated
      if (editingId) {
        updated = experiences.map((exp) =>
          exp.id === editingId ? { ...exp, ...experienceData } : exp
        )
      } else {
        const newId = String(Date.now())
        updated = [...experiences, { id: newId, ...experienceData }]
      }

      await updatePortfolio({
        sections: {
          experience: {
            content: {
              experiences: updated
            }
          }
        }
      })

      onNotification(
        `Experience ${editingId ? 'updated' : 'added'} successfully`,
        'success'
      )
      setShowForm(false)
      setEditingId(null)
    } catch (error) {
      onNotification('Failed to save experience', 'error')
    }
  }

  const addAchievement = () => {
    setFormData({
      ...formData,
      achievements: [...formData.achievements, '']
    })
  }

  const removeAchievement = (index) => {
    setFormData({
      ...formData,
      achievements: formData.achievements.filter((_, i) => i !== index)
    })
  }

  const updateAchievement = (index, value) => {
    const updated = [...formData.achievements]
    updated[index] = value
    setFormData({ ...formData, achievements: updated })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Manage Experience</h2>
        <button className="btn-primary" onClick={handleAdd}>
          + Add Experience
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="admin-form" style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>
          <div className="form-group">
            <label>Company *</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Role *</label>
            <input
              type="text"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Location *</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Period *</label>
              <input
                type="text"
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                placeholder="e.g., Mar 2023 - Present"
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Achievements *</label>
            {formData.achievements.map((achievement, index) => (
              <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <textarea
                  value={achievement}
                  onChange={(e) => updateAchievement(index, e.target.value)}
                  style={{ flex: 1 }}
                />
                {formData.achievements.length > 1 && (
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => removeAchievement(index)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="btn-secondary" onClick={addAchievement}>
              + Add Achievement
            </button>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn-primary">
              {editingId ? 'Update' : 'Add'} Experience
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setShowForm(false)
                setEditingId(null)
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="item-list">
        {experiences.length === 0 ? (
          <div className="empty-state">
            <p>No experiences added yet.</p>
            <button className="btn-primary" onClick={handleAdd}>
              Add First Experience
            </button>
          </div>
        ) : (
          experiences.map((exp) => (
            <div key={exp.id} className="item-card">
              <div className="item-content">
                <h3>{exp.company}</h3>
                <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0' }}>
                  {exp.role} • {exp.location} • {exp.period}
                </p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>
                  {exp.description}
                </p>
              </div>
              <div className="item-actions">
                <button className="btn-secondary" onClick={() => handleEdit(exp)}>
                  Edit
                </button>
                <button className="btn-danger" onClick={() => handleDelete(exp.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ExperienceEditor

