import { Suspense, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import PageSkeleton from '../ui/PageSkeleton'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import QuickTour from '../help/QuickTour'
import HowToPanel from '../help/HowToPanel'
import CommandPalette from '../help/CommandPalette'
import { useRole } from '../../lib/roleStore'
import { access } from '../../lib/roles'

const seen = () => { try { return localStorage.getItem('tourSeen') === '1' } catch { return true } }

export default function Layout() {
  const [open, setOpen] = useState(false)
  const [tour, setTour] = useState(() => !seen())
  const [help, setHelp] = useState(false)
  const [palette, setPalette] = useState(false)
  const [resets, setResets] = useState(0)
  const { role } = useRole()
  const { pathname, search } = useLocation()

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette((p) => !p) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const closeTour = () => {
    setTour(false)
    try { localStorage.setItem('tourSeen', '1') } catch { /* storage unavailable */ }
  }

  if (!access[role].includes(pathname)) return <Navigate to="/" replace />

  return (
    <div className="min-h-screen">
      <Sidebar open={open} onClose={() => setOpen(false)} onReset={() => setResets((n) => n + 1)} />
      <div className="lg:pl-64">
        <TopBar onMenu={() => setOpen(true)} onSearch={() => setPalette(true)} onHelp={() => setHelp(true)} />
        <main className="p-4 lg:p-8">
          <motion.div key={`${pathname}${search}-${resets}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}><Suspense fallback={<PageSkeleton />}><Outlet /></Suspense></motion.div>
        </main>
      </div>
      <QuickTour open={tour} onClose={closeTour} />
      <HowToPanel open={help} onClose={() => setHelp(false)} onTour={() => { setHelp(false); setTour(true) }} />
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  )
}
