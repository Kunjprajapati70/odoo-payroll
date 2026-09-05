import { useContext } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { AppContext } from '../../context/AppContext'

const icons = {
  success: <CheckCircle size={16} className="text-green-500" />,
  error: <AlertCircle size={16} className="text-red-500" />,
  warning: <AlertTriangle size={16} className="text-yellow-500" />,
  info: <Info size={16} className="text-blue-500" />,
}

const borders = {
  success: 'border-l-green-500',
  error: 'border-l-red-500',
  warning: 'border-l-yellow-500',
  info: 'border-l-blue-500',
}

export default function ToastContainer() {
  const { toasts, removeToast } = useContext(AppContext)

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-80">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`card p-3 flex items-start gap-3 border-l-4 ${borders[t.type] || borders.info} shadow-md`}
        >
          {icons[t.type] || icons.info}
          <p className="flex-1 text-sm text-gray-700">{t.message}</p>
          <button onClick={() => removeToast(t.id)} className="text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
