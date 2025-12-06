import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../utils/auth'
import './Login.css'

const Login = ({ onClose }) => {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [otpRequested, setOtpRequested] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [requestingOTP, setRequestingOTP] = useState(false)
  const { login } = useAuth()

  const handleRequestOTP = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setRequestingOTP(true)

    try {
      await authAPI.requestOTP(password)
      setOtpRequested(true)
      setSuccess('OTP has been sent to your email. Please check your inbox.')
      setPassword('')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request OTP')
    } finally {
      setRequestingOTP(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    const result = await login(otp)
    setLoading(false)

    if (result.success) {
      onClose()
      // Navigate to admin panel after successful login
      navigate('/admin')
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="login-overlay" onClick={onClose}>
      <div className="login-modal" onClick={(e) => e.stopPropagation()}>
        <button className="login-close" onClick={onClose}>×</button>
        <h2>Admin Login</h2>
        
        {!otpRequested ? (
          <form onSubmit={handleRequestOTP}>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password to request OTP"
                required
                autoFocus
                style={{ color: '#ffffff' }}
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <button type="submit" className="btn-login" disabled={requestingOTP}>
              {requestingOTP ? 'Requesting OTP...' : 'Request OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="otp">One-Time Password</label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 8-character OTP"
                required
                autoFocus
                maxLength={8}
                style={{ color: '#ffffff', letterSpacing: '2px', fontFamily: 'monospace' }}
              />
            </div>
            {success && <div style={{ color: '#64ffda', marginBottom: '10px', fontSize: '14px' }}>{success}</div>}
            {error && <div className="error-message">{error}</div>}
            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <button 
              type="button"
              onClick={() => {
                setOtpRequested(false)
                setOtp('')
                setError('')
                setSuccess('')
              }}
              className="forgot-password-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', marginTop: '10px' }}
            >
              Request New OTP
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default Login

