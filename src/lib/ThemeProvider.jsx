// Applies the light/dark theme to the page and remembers the choice.
import { useEffect, useState } from 'react'
import { ThemeContext, applyTheme, storedTheme, systemTheme } from './themeStore'

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => storedTheme() ?? systemTheme())

  useEffect(() => { applyTheme(theme) }, [theme])

  // Follow the OS setting until the user picks a theme explicitly.
  useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => { if (storedTheme()) return
      const next = mq.matches ? 'dark' : 'light'
      applyTheme(next); setTheme(next)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next); setTheme(next)
    try { localStorage.setItem('theme', next) } catch { /* storage unavailable */ }
  }

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>
}
