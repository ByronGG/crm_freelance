import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../lib/theme'

/** Interruptor claro/oscuro de la barra superior. */
export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted transition-colors hover:bg-app hover:text-fg"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
