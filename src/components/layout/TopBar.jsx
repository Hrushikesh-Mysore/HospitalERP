import ThemeToggle from './ThemeToggle'
import LiveDot from './LiveDot'
import RoleSwitcher from './RoleSwitcher'
import { Search, HelpCircle, HeartPulse } from 'lucide-react'
import { useRole } from '../../lib/roleStore'

export default function TopBar({ onSearch, onHelp }) {
  const { role } = useRole()
  const canSearch = role !== 'Patient' // search lists every patient, so it is staff-only
  return (
    <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-line bg-card/90 px-3 py-2 backdrop-blur sm:gap-3 sm:px-4 sm:py-3 lg:px-8">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-600 text-on-brand lg:hidden"><HeartPulse size={19} /></span>
      {canSearch ? (
        <button onClick={onSearch} className="relative flex min-w-0 max-w-md flex-1 items-center gap-2 rounded-xl border border-line bg-surface py-2 pl-3 pr-3 text-left text-sm text-muted transition-colors hover:border-brand-500">
          <Search size={16} className="shrink-0" /> <span className="flex-1 truncate">Search…</span>
          <kbd className="hidden rounded-md border border-line bg-card px-1.5 text-xs sm:block">Ctrl K</kbd>
        </button>
      ) : <span className="font-extrabold lg:hidden">MediCore</span>}
      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
        <LiveDot />
        <button onClick={onHelp} className="rounded-xl p-2 text-muted hover:bg-surface" aria-label="How to use"><HelpCircle size={19} /></button>
        <ThemeToggle />
        <RoleSwitcher className="hidden lg:flex" />
      </div>
    </header>
  )
}
