import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../lib/themeStore'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  return (
    <button onClick={toggle} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} title={dark ? 'Light mode' : 'Dark mode'}
      className="rounded-xl p-2 text-muted transition-colors hover:bg-surface hover:text-ink active:scale-95">
      {dark ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  )
}
