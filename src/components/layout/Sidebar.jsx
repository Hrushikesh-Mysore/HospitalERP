import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, CalendarDays, BedDouble, Siren, HeartPulse, X, RotateCcw } from 'lucide-react'
import { useToast } from '../ui/Toast'
import { api } from '../../lib/api'
import { useRole } from '../../lib/RoleContext'
import { access } from '../../lib/roles'

const items = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/patients', label: 'Patients', icon: Users },
  { to: '/appointments', label: 'Appointments', icon: CalendarDays },
  { to: '/beds', label: 'Beds', icon: BedDouble },
  { to: '/emergency', label: 'Emergency', icon: Siren },
]

export default function Sidebar({ open, onClose, onReset }) {
  const { role } = useRole()
  const toast = useToast()
  const reset = async () => {
    try { await api('/demo/reset', { method: 'POST' }); toast('Demo data reset'); onReset(); onClose() }
    catch (e) { toast(e.message, 'error') }
  }
  const visible = items.filter((i) => access[role].includes(i.to))
  const label = (i) => (role === 'Doctor' && i.to === '/patients' ? 'My Patients' : role === 'Doctor' && i.to === '/appointments' ? 'My Appointments' : role === 'Receptionist' && i.to === '/patients' ? 'Registration' : role === 'Receptionist' && i.to === '/appointments' ? 'Booking' : i.label)
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
          {visible.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.to === '/'} onClick={onClose}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${isActive ? 'bg-brand-50 text-brand-700' : 'text-muted hover:bg-surface hover:text-ink'}`}>
              <i.icon size={19} /> {label(i)}
            </NavLink>
          ))}
        </nav>
        <button onClick={reset} className="mt-auto flex items-center gap-2 rounded-xl border border-dashed border-line px-3 py-2.5 text-sm font-semibold text-muted transition-colors hover:border-brand-500 hover:text-brand-700">
          <RotateCcw size={16} /> Reset demo data
        </button>
        <p className="mt-3 rounded-xl bg-surface p-3 text-xs text-muted">Viewing as <b className="text-ink">{role}</b>{role === 'Doctor' && ' · Dr. Anil Rao'}</p>
      </aside>
    </>
  )
}
