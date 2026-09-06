import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { authService } from '../../services/authService'
import { minLength } from '../../utils/validators'
import { CheckCircle } from 'lucide-react'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const tokenFromUrl = (params.get('token') || '').trim()
  const [token, setToken] = useState(tokenFromUrl)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const t = (params.get('token') || '').trim()
    if (t) setToken(t)
  }, [params])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const cleanToken = token.trim().replace(/\s+/g, '')
    if (!cleanToken) {
      setError('Reset link is invalid or missing. Request a new password reset.')
      return
    }
    if (!minLength(password, 6)) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await authService.resetPassword(cleanToken, password)
      setDone(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to reset password. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-200">
            <span className="text-white font-bold text-2xl">P</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Set New Password</h1>
          <p className="text-sm text-gray-500 mt-1">
            {tokenFromUrl ? 'Choose a new password for your account' : 'Paste your reset token from email, then set a new password'}
          </p>
        </div>

        <div className="card p-6 shadow-md">
          {done ? (
            <div className="text-center py-4">
              <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-800 mb-1">Password updated</p>
              <p className="text-xs text-gray-500">Redirecting to sign in…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {!tokenFromUrl && (
                <Input
                  label="Reset Token"
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  placeholder="Paste token from email"
                  required
                />
              )}
              {tokenFromUrl && (
                <p className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                  Reset link verified. Enter your new password below.
                </p>
              )}
              <Input label="New Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
              <Input label="Confirm Password" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full justify-center" loading={loading}>Update Password</Button>
              <div className="text-center space-y-1">
                <Link to="/forgot-password" className="block text-xs text-primary-600 hover:text-primary-700">Request a new reset link</Link>
                <Link to="/login" className="block text-xs text-gray-500 hover:text-gray-700">Back to sign in</Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
