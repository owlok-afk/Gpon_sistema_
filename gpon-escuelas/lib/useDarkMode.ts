'use client'

import { useEffect, useState } from 'react'

export function useDarkMode() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('gpon_theme')
    if (saved === 'dark' || (!saved && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    } else {
      setIsDark(false)
      document.documentElement.classList.remove('dark')
    }
  }, [])

  function toggle() {
    const next = !isDark
    setIsDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('gpon_theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('gpon_theme', 'light')
    }
  }

  return { isDark, toggle }
}
