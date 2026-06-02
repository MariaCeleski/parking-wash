import { useState, useEffect } from 'react'
import './Toast.css'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastData {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastProps {
  toast: ToastData
  onRemove: (id: string) => void
}

function Toast({ toast, onRemove }: ToastProps) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const duration = toast.duration || 5000
    const timer = setTimeout(() => {
      setExiting(true)
      setTimeout(() => onRemove(toast.id), 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [toast, onRemove])

  const handleClose = () => {
    setExiting(true)
    setTimeout(() => onRemove(toast.id), 300)
  }

  const icons: Record<ToastType, string> = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
  }

  return (
    <div className={`toast toast-${toast.type} ${exiting ? 'toast-exit' : ''}`}>
      <span className="toast-icon">{icons[toast.type]}</span>
      <span className="toast-message">{toast.message}</span>
      <button className="toast-close" onClick={handleClose} aria-label="Fechar">
        ×
      </button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: ToastData[]
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}
