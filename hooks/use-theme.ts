'use client'

import { useCallback, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

const KEY = 'jackal-theme'

function resolveTheme(t: Theme): 'light' | 'dark' {
  if (t === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return t
}

function applyTheme(t: Theme) {
  const resolved = resolveTheme(t)
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('system')

  useEffect(() => {
    const stored = (localStorage.getItem(KEY) as Theme) || 'system'
    setThemeState(stored)
  }, [])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    localStorage.setItem(KEY, t)
    applyTheme(t)
  }, [])

  return { theme, setTheme }
}
