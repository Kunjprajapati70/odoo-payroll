import { useState } from 'react'
import { Link } from 'react-router-dom'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    // TODO: call authService.forgotPassword(email)
    setTimeout(() => { setSent(true); setLoading(false) }, 800)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-1">Reset your password</h2>
          <p className="text-sm text-gray-500 mb-5">Enter your email and we'll send you a reset link.</p>
          {sent ? (
            <p className="text-sm text-green-600">Check your inbox for a reset link.</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              <Button type="submit" className="w-full justify-center" loading={loading}>Send reset link</Button>
            </form>
          )}
          <Link to="/login" className="block text-center text-sm text-primary-600 mt-4 hover:underline">Back to login</Link>
        </div>
      </div>
    </div>
  )
}
