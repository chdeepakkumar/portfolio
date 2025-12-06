import { useState, useEffect } from 'react'
import { usePortfolio } from '../../context/PortfolioContext'

const ContactEditor = ({ onNotification }) => {
  const { portfolio, updatePortfolio } = usePortfolio()
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    icon: 'github',
    iconEmoji: '',
    label: ''
  })
  const [description, setDescription] = useState('')

  const contactData = portfolio?.contact?.content || {}
  const links = contactData.links || []

  useEffect(() => {
    if (contactData.description) {
      setDescription(contactData.description)
    }
  }, [contactData])

  const handleAdd = () => {
    setFormData({
      name: '',
      url: '',
      icon: 'github',
      iconEmoji: '',
      label: ''
    })
    setEditingId(null)
    setShowForm(true)
  }

  const handleEdit = (link) => {
    setFormData({
      name: link.name,
      url: link.url,
      icon: link.icon || 'github',
      iconEmoji: link.iconEmoji || '',
      label: link.label
    })
    setEditingId(link.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this contact link?')) return

    const updated = links.filter((link) => link.id !== id)
    try {
      await updatePortfolio({
        sections: {
          contact: {
            content: {
              ...contactData,
              links: updated
            }
          }
        }
      })
      onNotification('Contact link deleted successfully', 'success')
    } catch (error) {
      onNotification('Failed to delete contact link', 'error')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      let updatedLinks
      if (editingId) {
        updatedLinks = links.map((link) =>
          link.id === editingId ? { ...link, ...formData } : link
        )
      } else {
        const newId = String(Date.now())
        updatedLinks = [...links, { id: newId, ...formData }]
      }

      await updatePortfolio({
        sections: {
          contact: {
            content: {
              ...contactData,
              description,
              links: updatedLinks
            }
          }
        }
      })

      onNotification(
        `Contact link ${editingId ? 'updated' : 'added'} successfully`,
        'success'
      )
      setShowForm(false)
      setEditingId(null)
    } catch (error) {
      onNotification('Failed to save contact link', 'error')
    }
  }

  const handleDescriptionUpdate = async () => {
    try {
      await updatePortfolio({
        sections: {
          contact: {
            content: {
              ...contactData,
              description
            }
          }
        }
      })
      onNotification('Description updated successfully', 'success')
    } catch (error) {
      onNotification('Failed to update description', 'error')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Manage Contact</h2>
        <button className="btn-primary" onClick={handleAdd}>
          + Add Link
        </button>
      </div>

      <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>
        <div className="form-group">
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescriptionUpdate}
          />
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="admin-form" style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>URL *</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Icon Type</label>
            <select
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            >
              <option value="github">GitHub</option>
              <option value="leetcode">LeetCode</option>
              <option value="linkedin">LinkedIn</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="other">Other</option>
            </select>
            <small style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', display: 'block', marginTop: '0.5rem' }}>
              Used as fallback if custom emoji is not provided
            </small>
          </div>
          <div className="form-group">
            <label>Custom Icon (Emoji)</label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input
                type="text"
                value={formData.iconEmoji}
                onChange={(e) => setFormData({ ...formData, iconEmoji: e.target.value })}
                placeholder="e.g., 💻 📧 📱 🔗"
                style={{ flex: 1 }}
                maxLength={2}
              />
              {formData.iconEmoji && (
                <span style={{ fontSize: '2rem', minWidth: '3rem', textAlign: 'center' }}>
                  {formData.iconEmoji}
                </span>
              )}
            </div>
            <small style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', display: 'block', marginTop: '0.5rem' }}>
              Enter an emoji to use as custom icon (optional). If provided, this will override the icon type.
            </small>
          </div>
          <div className="form-group">
            <label>Label (Accessibility)</label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="e.g., View my code repositories"
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn-primary">
              {editingId ? 'Update' : 'Add'} Link
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
        {links.length === 0 ? (
          <div className="empty-state">
            <p>No contact links added yet.</p>
            <button className="btn-primary" onClick={handleAdd}>
              Add First Link
            </button>
          </div>
        ) : (
          links.map((link) => (
            <div key={link.id} className="item-card">
              <div className="item-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  {link.iconEmoji ? (
                    <span style={{ fontSize: '1.5rem' }}>{link.iconEmoji}</span>
                  ) : (
                    <span style={{ fontSize: '1.5rem' }}>
                      {link.icon === 'github' ? '💻' : 
                       link.icon === 'leetcode' ? '📊' : 
                       link.icon === 'linkedin' ? '💼' : 
                       link.icon === 'email' ? '📧' : 
                       link.icon === 'phone' ? '📱' : '🔗'}
                    </span>
                  )}
                  <h3 style={{ margin: 0 }}>{link.name}</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0' }}>
                  {link.url}
                </p>
                {link.label && (
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>
                    {link.label}
                  </p>
                )}
              </div>
              <div className="item-actions">
                <button className="btn-secondary" onClick={() => handleEdit(link)}>
                  Edit
                </button>
                <button className="btn-danger" onClick={() => handleDelete(link.id)}>
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

export default ContactEditor

