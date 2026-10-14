import { Menu, Search, Bell, HelpCircle } from 'lucide-react'
import { useFetch } from '../../lib/useFetch'
import { useRole } from '../../lib/roleStore'
import { roles } from '../../lib/roles'

export default function TopBar({ onMenu, onSearch, onHelp }) {
  const { role, setRole, doctorId, setDoctorId } = useRole()
  const docs = useFetch('/doctors')
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-card/90 px-4 py-3 backdrop-blur lg:px-8">
      <button className="rounded-lg p-2 hover:bg-surface lg:hidden" onClick={onMenu} aria-label="Open menu"><Menu size={20} /></button>
      <button onClick={onSearch} className="relative flex min-w-0 max-w-md flex-1 items-center gap-2 rounded-xl border border-line bg-surface py-2 pl-3 pr-3 text-left text-sm text-muted transition-colors hover:border-brand-500">
        <Search size={16} /> <span className="flex-1 truncate">Search patients, doctors…</span>
        <kbd className="hidden rounded-md border border-line bg-white px-1.5 text-xs sm:block">Ctrl K</kbd>
      </button>
      <div className="ml-auto flex items-center gap-2">
        <button onClick={onHelp} className="rounded-xl p-2 text-muted hover:bg-surface" aria-label="How to use"><HelpCircle size={19} /></button>
        <button className="relative hidden rounded-xl p-2 sm:block text-muted hover:bg-surface" aria-label="Notifications">
          <Bell size={19} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" />
        </button>
        {role === 'Doctor' && (
          <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} aria-label="View as doctor"
            className="w-32 rounded-xl border border-brand-200 bg-brand-50 px-2 py-2 text-sm font-semibold text-brand-700 outline-none focus:border-brand-500 sm:w-auto sm:px-3">
            {(docs.data?.doctors ?? [{ id: doctorId, name: `Doctor ${doctorId}` }]).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        )}
        <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Switch role"
          className="w-28 rounded-xl border border-line bg-white px-2 py-2 text-sm font-semibold outline-none sm:w-auto sm:px-3 focus:border-brand-500">
          {roles.map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>
    </header>
  )
}
