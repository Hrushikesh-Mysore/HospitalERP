import { NavLink } from 'react-router-dom'
import { HeartPulse, RotateCcw } from 'lucide-react'
import { useRole } from '../../lib/roleStore'
import { access } from '../../lib/roles'
import { navItems, navLabel } from '../../lib/nav'
import { useResetDemo } from '../../lib/useResetDemo'

// Desktop only: phones use the bottom tab bar instead.
export default function Sidebar({ onReset }) {
  const { role } = useRole()
  const reset = useResetDemo(onReset)
  const visible = navItems.filter((i) => access[role].includes(i.to))
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-card p-4 lg:flex">
      <div className="mb-6 flex items-center gap-2 px-2 text-lg font-extrabold">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-on-brand"><HeartPulse size={20} /></span>
        MediCore
      </div>
      <nav className="flex flex-col gap-1">
        {visible.map((i) => (
          <NavLink key={i.to} to={i.to} end={i.to === '/'}
            className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${isActive ? 'bg-brand-50 text-brand-700' : 'text-muted hover:bg-surface hover:text-ink'}`}>
            <i.icon size={19} /> {navLabel(i, role)}
          </NavLink>
        ))}
      </nav>
      {role !== 'Patient' && <button onClick={reset} className="mt-auto flex items-center gap-2 rounded-xl border border-dashed border-line px-3 py-2.5 text-sm font-semibold text-muted transition-colors hover:border-brand-500 hover:text-brand-700">
        <RotateCcw size={16} /> Reset demo data
      </button>}
      <p className={`${role === 'Patient' ? 'mt-auto' : 'mt-3'} rounded-xl bg-surface p-3 text-xs text-muted`}>Viewing as <b className="text-ink">{role}</b></p>
    </aside>
  )
}
