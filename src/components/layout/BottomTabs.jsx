import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Ellipsis, RotateCcw, HelpCircle } from 'lucide-react'
import Modal from '../ui/Modal'
import RoleSwitcher from './RoleSwitcher'
import { useRole } from '../../lib/roleStore'
import { access, tabs } from '../../lib/roles'
import { navItems, navLabel } from '../../lib/nav'
import { useResetDemo } from '../../lib/useResetDemo'

// Phone navigation: primary tabs per role, plus a "More" bottom sheet for the rest, role switching and reset.
export default function BottomTabs({ onHelp, onReset }) {
  const { role } = useRole()
  const { pathname } = useLocation()
  const [more, setMore] = useState(false)
  const reset = useResetDemo(() => { onReset(); setMore(false) })
  const primary = tabs[role].map((to) => navItems.find((i) => i.to === to))
  const rest = access[role].filter((to) => !tabs[role].includes(to)).map((to) => navItems.find((i) => i.to === to))
  const base = 'flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors'

  return (
    <>
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${primary.length + 1}, minmax(0, 1fr))` }}>
          {primary.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.to === '/'} className={({ isActive }) => `${base} ${isActive ? 'text-brand-700' : 'text-muted'}`}>
              <i.icon size={21} /> {i.short ?? navLabel(i, role)}
            </NavLink>
          ))}
          <button onClick={() => setMore(true)} className={`${base} ${rest.some((i) => i.to === pathname) ? 'text-brand-700' : 'text-muted'}`}>
            <Ellipsis size={21} /> More
          </button>
        </div>
      </nav>
      <Modal open={more} onClose={() => setMore(false)} title="More">
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-semibold text-muted">Viewing as</p>
            <RoleSwitcher className="flex-wrap" />
          </div>
          {rest.length > 0 && (
            <div className="space-y-1">
              {rest.map((i) => (
                <NavLink key={i.to} to={i.to} onClick={() => setMore(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold hover:bg-surface">
                  <i.icon size={20} className="text-brand-600" /> {navLabel(i, role)}
                </NavLink>
              ))}
            </div>
          )}
          <div className="space-y-1 border-t border-line pt-3">
            <button onClick={() => { setMore(false); onHelp() }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold hover:bg-surface"><HelpCircle size={20} className="text-muted" /> How to use</button>
            {role !== 'Patient' && <button onClick={reset} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold hover:bg-surface"><RotateCcw size={20} className="text-muted" /> Reset demo data</button>}
          </div>
        </div>
      </Modal>
    </>
  )
}
