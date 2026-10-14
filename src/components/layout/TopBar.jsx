import { Menu, Search, Bell } from 'lucide-react'

export const roles = ['Admin', 'Doctor', 'Receptionist']

export default function TopBar({ role, onRoleChange, onMenu }) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-card/90 px-4 py-3 backdrop-blur lg:px-8">
      <button className="rounded-lg p-2 hover:bg-surface lg:hidden" onClick={onMenu} aria-label="Open menu"><Menu size={20} /></button>
      <div className="relative max-w-md flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input placeholder="Search patients, doctors…" className="w-full rounded-xl border border-line bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
      </div>
      <div className="ml-auto flex items-center gap-3">
        <button className="relative rounded-xl p-2 text-muted hover:bg-surface" aria-label="Notifications">
          <Bell size={19} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" />
        </button>
        <select value={role} onChange={(e) => onRoleChange(e.target.value)} aria-label="Switch role"
          className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-brand-500">
          {roles.map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>
    </header>
  )
}
