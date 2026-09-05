import { useState } from 'react'
import { Link } from 'react-router-dom'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { authService } from '../../services/authService'
import { CheckCircle } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email) { setError('Please enter your email'); return }
    setLoading(true)
    try {
      await authService.forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send reset email')
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
          <h1 className="text-xl font-bold text-gray-900">Reset Password</h1>
          <p className="text-sm text-gray-500 mt-1">Enter your email to receive a reset link</p>
        </div>

        <div className="card p-6 shadow-md">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-800 mb-1">Check your inbox</p>
              <p className="text-xs text-gray-500">We&apos;ve sent a password reset link to <strong>{email}</strong></p>
              <Link to="/login" className="block mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full justify-center" loading={loading}>
                Send Reset Link
              </Button>
              <div className="text-center">
                <Link to="/login" className="text-xs text-gray-500 hover:text-gray-700">Back to sign in</Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
