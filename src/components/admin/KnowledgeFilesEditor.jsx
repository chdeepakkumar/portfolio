import { useState, useEffect } from 'react'
import { portfolioAPI } from '../../utils/auth'
import './KnowledgeFilesEditor.css'

const KnowledgeFilesEditor = ({ onNotification }) => {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    try {
      setLoading(true)
      const response = await portfolioAPI.getKnowledgeFiles()
      setFiles(response.files || [])
    } catch (error) {
      console.error('Error loading knowledge files:', error)
      onNotification('Failed to load knowledge files', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      if (!file.name.endsWith('.json')) {
        onNotification('Please select a JSON file', 'error')
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

    // Check file limit before uploading
    if (files.length >= 20) {
      onNotification('Maximum file limit reached (20 files). Please delete some files first.', 'error')
      return
    }

    try {
      setUploading(true)
      await portfolioAPI.uploadKnowledgeFile(selectedFile)
      onNotification('File uploaded successfully', 'success')
      setSelectedFile(null)
      // Reset file input
      const fileInput = document.getElementById('knowledge-file-input')
      if (fileInput) {
        fileInput.value = ''
      }
      loadFiles()
    } catch (error) {
      const errorMessage = error.response?.data?.details || error.response?.data?.error || 'Failed to upload file'
      onNotification(errorMessage, 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (filename) => {
    if (!window.confirm(`Are you sure you want to delete ${filename}?`)) {
      return
    }

    try {
      await portfolioAPI.deleteKnowledgeFile(filename)
      onNotification('File deleted successfully', 'success')
      loadFiles()
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to delete file'
      onNotification(errorMessage, 'error')
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
      <div className="knowledge-files-loading">
        <div className="loading-spinner"></div>
        <p>Loading knowledge files...</p>
      </div>
    )
  }

  return (
    <div className="knowledge-files-editor">
      <div className="knowledge-files-header">
        <h2>Knowledge Files Management</h2>
        <p className="knowledge-files-description">
          Upload JSON files containing information about you. These files will be used by the chatbot to answer questions.
          <br />
          <strong>Limits:</strong> Maximum 20 files, 1MB per file.
          <br />
          <a 
            href={`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/portfolio/knowledge-files/README.md`}
            target="_blank" 
            rel="noopener noreferrer"
            className="readme-link"
          >
            📖 View JSON Format Guidelines
          </a>
        </p>
      </div>

      <div className="upload-section">
        <h3>Upload New File</h3>
        <div className="upload-controls">
          <input
            id="knowledge-file-input"
            type="file"
            accept=".json,application/json"
            onChange={handleFileSelect}
            className="file-input"
          />
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="btn-upload"
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
        {selectedFile && (
          <p className="selected-file">Selected: {selectedFile.name}</p>
        )}
      </div>

      <div className="files-list-section">
        <h3>Uploaded Files ({files.length}/20)</h3>
        {files.length >= 20 && (
          <p className="file-limit-warning">
            ⚠️ Maximum file limit reached (20 files). Delete some files to upload new ones.
          </p>
        )}
        {files.length === 0 ? (
          <p className="no-files">No knowledge files uploaded yet.</p>
        ) : (
          <div className="files-list">
            {files.map((file) => (
              <div key={file.filename} className="file-item">
                <div className="file-info">
                  <div className="file-name">{file.filename}</div>
                  <div className="file-meta">
                    <span>{formatFileSize(file.size)}</span>
                    <span>•</span>
                    <span>Modified: {formatDate(file.modified)}</span>
                  </div>
                </div>
                <div className="file-actions">
                  {file.filename !== 'resume.json' && (
                    <button
                      onClick={() => handleDelete(file.filename)}
                      className="btn-delete"
                    >
                      Delete
                    </button>
                  )}
                  {file.filename === 'resume.json' && (
                    <span className="resume-badge">Main Resume</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default KnowledgeFilesEditor

