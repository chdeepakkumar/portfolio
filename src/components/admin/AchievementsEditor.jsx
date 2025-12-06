import { useState } from 'react'
import { usePortfolio } from '../../context/PortfolioContext'

const AchievementsEditor = ({ onNotification }) => {
  const { portfolio, updatePortfolio } = usePortfolio()
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    icon: '',
    title: '',
    value: '',
    description: ''
  })

  const achievements = portfolio?.achievements?.content?.items || []

  const handleAdd = () => {
    setFormData({
      icon: '',
      title: '',
      value: '',
      description: ''
    })
    setEditingId(null)
    setShowForm(true)
  }

  const handleEdit = (item) => {
    setFormData({
      icon: item.icon,
      title: item.title,
      value: item.value,
      description: item.description
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this achievement?')) return

    const updated = achievements.filter((item) => item.id !== id)
    try {
      await updatePortfolio({
        sections: {
          achievements: {
            content: {
              items: updated
            }
          }
        }
      })
      onNotification('Achievement deleted successfully', 'success')
    } catch (error) {
      onNotification('Failed to delete achievement', 'error')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      let updated
      if (editingId) {
        updated = achievements.map((item) =>
          item.id === editingId ? { ...item, ...formData } : item
        )
      } else {
        const newId = String(Date.now())
        updated = [...achievements, { id: newId, ...formData }]
      }

      await updatePortfolio({
        sections: {
          achievements: {
            content: {
              items: updated
            }
          }
        }
      })

      onNotification(
        `Achievement ${editingId ? 'updated' : 'added'} successfully`,
        'success'
      )
      setShowForm(false)
      setEditingId(null)
    } catch (error) {
      onNotification('Failed to save achievement', 'error')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Manage Achievements</h2>
        <button className="btn-primary" onClick={handleAdd}>
          + Add Achievement
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="admin-form" style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>
          <div className="form-group">
            <label>Icon (Emoji) *</label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="e.g., 🏆"
              required
            />
          </div>
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Value *</label>
            <input
              type="text"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn-primary">
              {editingId ? 'Update' : 'Add'} Achievement
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
        {achievements.length === 0 ? (
          <div className="empty-state">
            <p>No achievements added yet.</p>
            <button className="btn-primary" onClick={handleAdd}>
              Add First Achievement
            </button>
          </div>
        ) : (
          achievements.map((item) => (
            <div key={item.id} className="item-card">
              <div className="item-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '2rem' }}>{item.icon}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p style={{ color: 'var(--accent-primary)', fontSize: '1.2rem', margin: '0.5rem 0' }}>
                      {item.value}
                    </p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>
                      {item.description}
                    </p>
                  </div>
                </div>
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

export default AchievementsEditor

