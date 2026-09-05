import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function Input({ label, error, className = '', type = 'text', ...props }) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

  return (
    <div className="w-full">
      {label && <label className="label-base">{label}</label>}
      <div className="relative">
        <input
          type={inputType}
          className={`input-base ${isPassword ? 'pr-10' : ''} ${error ? 'border-red-400 focus:ring-red-400' : ''} ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
