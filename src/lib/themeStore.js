import { createContext, useContext } from 'react'

export const ThemeContext = createContext({ theme: 'light', toggle: () => {} })
export const useTheme = () => useContext(ThemeContext)

export const systemTheme = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

export const storedTheme = () => {
  try { const t = localStorage.getItem('theme'); return t === 'dark' || t === 'light' ? t : null } catch { return null }
}

// Applied synchronously (before React re-renders) so token reads in render see the new theme.
export const applyTheme = (t) => { document.documentElement.dataset.theme = t }
