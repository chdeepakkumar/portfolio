import { useState } from 'react'
import { usePortfolio } from '../../context/PortfolioContext'

const SkillsEditor = ({ onNotification }) => {
  const { portfolio, updatePortfolio } = usePortfolio()
  const [editingCategory, setEditingCategory] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    categoryName: '',
    skills: ['']
  })

  const categories = portfolio?.skills?.content?.categories || {}

  const handleAddCategory = () => {
    setFormData({
      categoryName: '',
      skills: ['']
    })
    setEditingCategory(null)
    setShowForm(true)
  }

  const handleEditCategory = (categoryName) => {
    setFormData({
      categoryName,
      skills: categories[categoryName] && categories[categoryName].length > 0
        ? categories[categoryName]
        : ['']
    })
    setEditingCategory(categoryName)
    setShowForm(true)
  }

  const handleDeleteCategory = async (categoryName) => {
    if (!confirm(`Are you sure you want to delete the "${categoryName}" category?`)) return

    const updated = { ...categories }
    delete updated[categoryName]

    try {
      await updatePortfolio({
        sections: {
          skills: {
            content: {
              categories: updated
            }
          }
        }
      })
      onNotification('Category deleted successfully', 'success')
    } catch (error) {
      onNotification('Failed to delete category', 'error')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const skillList = formData.skills.filter((s) => s.trim() !== '')
    if (skillList.length === 0) {
      onNotification('Please add at least one skill', 'error')
      return
    }

    try {
      const updated = { ...categories }

      if (editingCategory && editingCategory !== formData.categoryName) {
        // Category renamed
        delete updated[editingCategory]
      }

      updated[formData.categoryName] = skillList

      await updatePortfolio({
        sections: {
          skills: {
            content: {
              categories: updated
            }
          }
        }
      })

      onNotification(
        `Category ${editingCategory ? 'updated' : 'added'} successfully`,
        'success'
      )
      setShowForm(false)
      setEditingCategory(null)
    } catch (error) {
      onNotification('Failed to save category', 'error')
    }
  }

  const addSkill = () => {
    setFormData({
      ...formData,
      skills: [...formData.skills, '']
    })
  }

  const removeSkill = (index) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((_, i) => i !== index)
    })
  }

  const updateSkill = (index, value) => {
    const updated = [...formData.skills]
    updated[index] = value
    setFormData({ ...formData, skills: updated })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Manage Skills</h2>
        <button className="btn-primary" onClick={handleAddCategory}>
          + Add Category
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="admin-form" style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>
          <div className="form-group">
            <label>Category Name *</label>
            <input
              type="text"
              value={formData.categoryName}
              onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Skills *</label>
            {formData.skills.map((skill, index) => (
              <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="text"
                  value={skill}
                  onChange={(e) => updateSkill(index, e.target.value)}
                  style={{ flex: 1 }}
                />
                {formData.skills.length > 1 && (
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => removeSkill(index)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="btn-secondary" onClick={addSkill}>
              + Add Skill
            </button>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn-primary">
              {editingCategory ? 'Update' : 'Add'} Category
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setShowForm(false)
                setEditingCategory(null)
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="item-list">
        {Object.keys(categories).length === 0 ? (
          <div className="empty-state">
            <p>No skill categories added yet.</p>
            <button className="btn-primary" onClick={handleAddCategory}>
              Add First Category
            </button>
          </div>
        ) : (
          Object.entries(categories).map(([categoryName, skills]) => (
            <div key={categoryName} className="item-card">
              <div className="item-content">
                <h3>{categoryName}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {skills.map((skill, index) => (
                    <span
                      key={index}
                      style={{
                        background: 'var(--bg-secondary)',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.9rem',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div className="item-actions">
                <button className="btn-secondary" onClick={() => handleEditCategory(categoryName)}>
                  Edit
                </button>
                <button className="btn-danger" onClick={() => handleDeleteCategory(categoryName)}>
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

export default SkillsEditor

