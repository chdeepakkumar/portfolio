import { useState, useEffect } from 'react'
import { portfolioAPI } from '../../utils/auth'
import './FileUpload.css'

const ResumeEditor = ({ onNotification }) => {
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [activating, setActivating] = useState(null)

  useEffect(() => {
    loadResumes()
  }, [])

  const loadResumes = async () => {
    try {
      setLoading(true)
      const response = await portfolioAPI.listResumes()
      setResumes(response.resumes || [])
    } catch (error) {
      console.error('Error loading resumes:', error)
      onNotification('Failed to load resumes', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      if (!file.name.endsWith('.pdf') && file.type !== 'application/pdf') {
        onNotification('Please select a PDF file', 'error')
        return
      }
      
      // Check file size (1MB limit)
      const maxSize = 1 * 1024 * 1024 // 1MB
      if (file.size > maxSize) {
        onNotification('File size exceeds 1MB limit. Please select a smaller file.', 'error')
        return
      }
      
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      onNotification('Please select a file to upload', 'error')
      return
    }

    try {
      setUploading(true)
      await portfolioAPI.uploadResume(selectedFile)
      onNotification('Resume uploaded successfully', 'success')
      setSelectedFile(null)
      // Reset file input
      const fileInput = document.getElementById('resume-file-input')
      if (fileInput) {
        fileInput.value = ''
      }
      loadResumes()
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to upload resume'
      onNotification(errorMessage, 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleActivate = async (filename) => {
    try {
      setActivating(filename)
      await portfolioAPI.setActiveResume(filename)
      onNotification('Active resume updated successfully', 'success')
      loadResumes()
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to set active resume'
      onNotification(errorMessage, 'error')
    } finally {
      setActivating(null)
    }
  }

  const handleDelete = async (filename) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}"? This action cannot be undone.`)) {
      return
    }

    try {
      setDeleting(filename)
      await portfolioAPI.deleteResume(filename)
      onNotification('Resume deleted successfully', 'success')
      loadResumes()
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to delete resume'
      onNotification(errorMessage, 'error')
    } finally {
      setDeleting(null)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', flexDirection: 'column', gap: '1rem' }}>
        <div className="loading-spinner"></div>
        <p>Loading resumes...</p>
      </div>
    )
  }

  const activeResume = resumes.find(r => r.isActive)
  const maxResumes = 10

  return (
    <div>
      <h2>Manage Resumes</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Manage your resume files. You can store up to {maxResumes} resumes and set one as active for download.
        {activeResume && (
          <span style={{ display: 'block', marginTop: '0.5rem', color: 'var(--accent-color)' }}>
            ✓ Active resume: <strong>{activeResume.filename}</strong>
          </span>
        )}
      </p>

      {/* Resumes List */}
      <div style={{ marginBottom: '2rem' }}>
        <h3>Available Resumes ({resumes.length}/{maxResumes})</h3>
        {resumes.length === 0 ? (
          <div style={{ 
            padding: '1.5rem', 
            background: 'rgba(255, 193, 7, 0.1)', 
            borderRadius: '4px',
            border: '1px solid rgba(255, 193, 7, 0.3)',
            marginTop: '1rem'
          }}>
            <p style={{ color: 'var(--text-secondary)' }}>
              ⚠️ No resume files found. Please upload a resume PDF file.
            </p>
          </div>
        ) : (
          <div style={{ marginTop: '1rem' }}>
            {resumes.map((resume) => (
              <div
                key={resume.filename}
                style={{
                  padding: '1.5rem',
                  background: resume.isActive ? 'rgba(76, 175, 80, 0.1)' : 'var(--bg-tertiary)',
                  borderRadius: '4px',
                  marginBottom: '1rem',
                  border: resume.isActive ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <strong style={{ color: resume.isActive ? 'var(--accent-color)' : 'var(--text-primary)' }}>
                      {resume.filename}
                    </strong>
                    {resume.isActive && (
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        background: 'var(--accent-color)',
                        color: '#fff',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}>
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <p>Size: {formatFileSize(resume.size)}</p>
                    <p>Modified: {formatDate(resume.modified)}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {!resume.isActive && (
                    <button
                      onClick={() => handleActivate(resume.filename)}
                      disabled={activating === resume.filename}
                      className="btn-primary"
                      style={{ minWidth: '100px' }}
                    >
                      {activating === resume.filename ? 'Activating...' : 'Activate'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(resume.filename)}
                    disabled={deleting === resume.filename || (resume.isActive && resumes.length === 1)}
                    className="btn-danger"
                    style={{ minWidth: '100px' }}
                    title={resume.isActive && resumes.length === 1 ? 'Cannot delete the only resume' : ''}
                  >
                    {deleting === resume.filename ? 'Deleting...' : 'Remove'}
                  </button>
                  <a
                    href={`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/portfolio/resume/${encodeURIComponent(resume.filename)}`}
                    download={resume.filename}
                    className="btn-secondary"
                    style={{ minWidth: '100px', textAlign: 'center', textDecoration: 'none', display: 'inline-block' }}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Section */}
      <div className="upload-section">
        <h3>Upload New Resume</h3>
        {resumes.length >= maxResumes ? (
          <div style={{
            padding: '1rem',
            background: 'rgba(244, 67, 54, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(244, 67, 54, 0.3)',
            marginTop: '1rem'
          }}>
            <p style={{ color: 'var(--text-secondary)' }}>
              ⚠️ Maximum number of resumes ({maxResumes}) reached. Please delete a resume before uploading a new one.
            </p>
          </div>
        ) : (
          <>
            <div className="upload-controls">
              <div className="file-input-wrapper">
                <input
                  id="resume-file-input"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="file-input"
                />
                <label
                  htmlFor="resume-file-input"
                  className={`file-input-label pdf ${selectedFile ? 'has-file' : ''}`}
                >
                  {selectedFile ? selectedFile.name : 'Choose PDF file'}
                </label>
              </div>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading || resumes.length >= maxResumes}
                className="btn-upload"
              >
                {uploading ? (
                  <>
                    <span className="upload-spinner"></span>
                    Uploading...
                  </>
                ) : (
                  'Upload Resume'
                )}
              </button>
            </div>
            <small className="file-upload-hint">
              Maximum file size: 1MB. Only PDF files are allowed. You can store up to {maxResumes} resumes.
            </small>
            {selectedFile && (
              <div className="selected-file">
                <span>Selected:</span>
                <strong>{selectedFile.name}</strong>
                <span style={{ marginLeft: 'auto', opacity: 0.7 }}>
                  ({formatFileSize(selectedFile.size)})
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ResumeEditor
