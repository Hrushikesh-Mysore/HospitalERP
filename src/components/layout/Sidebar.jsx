import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, CalendarDays, BedDouble, Siren, HeartPulse, X } from 'lucide-react'

const items = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/patients', label: 'Patients', icon: Users },
  { to: '/appointments', label: 'Appointments', icon: CalendarDays },
  { to: '/beds', label: 'Beds', icon: BedDouble },
  { to: '/emergency', label: 'Emergency', icon: Siren },
]

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-card p-4 transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-6 flex items-center justify-between px-2">
          <div className="flex items-center gap-2 text-lg font-extrabold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white"><HeartPulse size={20} /></span>
            MediCore
          </div>
          <button className="lg:hidden" onClick={onClose} aria-label="Close menu"><X size={20} /></button>
        </div>
        <nav className="flex flex-col gap-1">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={onClose}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${isActive ? 'bg-brand-50 text-brand-700' : 'text-muted hover:bg-surface hover:text-ink'}`}>
              <Icon size={19} /> {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
