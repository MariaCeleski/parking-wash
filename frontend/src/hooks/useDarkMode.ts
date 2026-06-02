import { useState, useEffect } from 'react'

export function useDarkMode(): [boolean, () => void] {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('parkingwash-theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
      localStorage.setItem('parkingwash-theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('parkingwash-theme', 'light')
    }
  }, [isDark])

  const toggle = () => setIsDark(prev => !prev)

  return [isDark, toggle]
}
