import { AlertTriangle } from 'lucide-react'
import Button from './Button'

export default function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AlertTriangle size={40} className="text-red-400 mb-3" />
      <p className="text-sm text-gray-600 mb-4">{message}</p>
      {onRetry && <Button variant="secondary" size="sm" onClick={onRetry}>Try again</Button>}
    </div>
  )
}
