// Returns chart colors that follow the current theme.
import { useTheme } from './themeStore'

const read = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

// Resolved token values for SVG props. Subscribes to the theme so charts re-render on toggle;
// the theme attribute is already applied by then, so the reads below see the new values.
export function useChartColors() {
  const { theme } = useTheme()
  return {
    theme,
    line: read('--color-brand-600'),
    bar: read('--color-brand-500'),
    grid: read('--color-line'),
    tick: read('--color-muted'),
    ink: read('--color-ink'),
    card: read('--color-card'),
    cursor: read('--color-brand-50'),
  }
}
