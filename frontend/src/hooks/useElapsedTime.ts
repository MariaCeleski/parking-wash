import { useState, useEffect } from 'react'

export function useElapsedTime(entryTime: string): string {
  const [elapsed, setElapsed] = useState<string>('00:00:00')

  useEffect(() => {
    const updateElapsed = () => {
      const entry = new Date(entryTime).getTime()
      const now = new Date().getTime()
      const diff = Math.floor((now - entry) / 1000)

      const hours = Math.floor(diff / 3600)
      const minutes = Math.floor((diff % 3600) / 60)
      const seconds = diff % 60

      const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      setElapsed(formatted)
    }

    updateElapsed()
    const interval = setInterval(updateElapsed, 1000)

    return () => clearInterval(interval)
  }, [entryTime])

  return elapsed
}
