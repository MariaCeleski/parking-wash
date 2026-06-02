import { useState, useCallback } from 'react'
import type { ToastData, ToastType } from '../components/Toast/Toast'

let toastCounter = 0

export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const addToast = useCallback((message: string, type: ToastType = 'success', duration?: number) => {
    const id = `toast-${++toastCounter}-${Date.now()}`
    setToasts((prev) => [...prev, { id, message, type, duration }])
    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const success = useCallback((message: string, duration?: number) => {
    return addToast(message, 'success', duration)
  }, [addToast])

  const error = useCallback((message: string, duration?: number) => {
    return addToast(message, 'error', duration)
  }, [addToast])

  const info = useCallback((message: string, duration?: number) => {
    return addToast(message, 'info', duration)
  }, [addToast])

  return { toasts, addToast, removeToast, success, error, info }
}
