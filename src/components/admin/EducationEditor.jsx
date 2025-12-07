import { useState } from 'react'
import { usePortfolio } from '../../context/PortfolioContext'

const EducationEditor = ({ onNotification }) => {
  const { portfolio, updatePortfolio } = usePortfolio()
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    degree: '',
    institution: '',
    location: '',
    period: ''
  })

  const educationItems = portfolio?.education?.content?.items || []

  const handleAdd = () => {
    setFormData({
      degree: '',
      institution: '',
      location: '',
      period: ''
    })
    setEditingId(null)
    setShowForm(true)
  }

  const handleEdit = (item) => {
    setFormData({
      degree: item.degree,
      institution: item.institution,
      location: item.location,
      period: item.period
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this education entry?')) return

    const updated = educationItems.filter((item) => item.id !== id)
    try {
      const educationContent = portfolio?.education?.content || {}
      await updatePortfolio({
        sections: {
          education: {
            content: {
              ...educationContent,
              items: updated
            }
          }
        }
      })
      onNotification('Education entry deleted successfully', 'success')
    } catch (error) {
      console.error('Error deleting education entry:', error)
      onNotification(error.message || 'Failed to delete education entry', 'error')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      let updated
      if (editingId) {
        updated = educationItems.map((item) =>
          item.id === editingId ? { ...item, ...formData } : item
        )
      } else {
        const newId = String(Date.now())
        updated = [...educationItems, { id: newId, ...formData }]
      }

      await updatePortfolio({
        sections: {
          education: {
            content: {
              items: updated
            }
          }
        }
      })

      onNotification(
        `Education entry ${editingId ? 'updated' : 'added'} successfully`,
        'success'
      )
      setShowForm(false)
      setEditingId(null)
    } catch (error) {
      onNotification('Failed to save education entry', 'error')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Manage Education</h2>
        <button className="btn-primary" onClick={handleAdd}>
          + Add Education
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="admin-form" style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>
          <div className="form-group">
            <label>Degree *</label>
            <input
              type="text"
              value={formData.degree}
              onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Institution *</label>
            <input
              type="text"
              value={formData.institution}
              onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
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
                placeholder="e.g., Aug 2016 - July 2020"
                required
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn-primary">
              {editingId ? 'Update' : 'Add'} Education
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
        {educationItems.length === 0 ? (
          <div className="empty-state">
            <p>No education entries added yet.</p>
            <button className="btn-primary" onClick={handleAdd}>
              Add First Education
            </button>
          </div>
        ) : (
          educationItems.map((item) => (
            <div key={item.id} className="item-card">
              <div className="item-content">
                <h3>{item.degree}</h3>
                <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0' }}>
                  {item.institution}
                </p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>
                  {item.location} • {item.period}
                </p>
              </div>
              <div className="item-actions">
                <button className="btn-secondary" onClick={() => handleEdit(item)}>
                  Edit
                </button>
                <button className="btn-danger" onClick={() => handleDelete(item.id)}>
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

export default EducationEditor

