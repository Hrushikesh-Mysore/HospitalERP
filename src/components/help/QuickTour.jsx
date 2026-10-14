import { useState } from 'react'
import { LayoutDashboard, Users, CalendarDays, BedDouble, UserCog } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

const steps = [
  { icon: LayoutDashboard, title: 'Welcome to MediCore', text: 'Your live hospital overview: KPIs, admissions, department load and recent activity, all computed from the API.' },
  { icon: Users, title: 'Patients', text: 'Search, filter and sort patients. Click a row for vitals and history, or add a new patient.' },
  { icon: CalendarDays, title: 'Appointments', text: 'Pick a date, then book a doctor and time slot. Double-bookings are rejected with a clear message.' },
  { icon: BedDouble, title: 'Beds & Emergency', text: 'Admit and discharge from the bed grid. Emergency cases queue by triage priority; assign them straight to a bed.' },
  { icon: UserCog, title: 'Roles & help', text: 'Switch role (top right) to see Admin, Doctor or Receptionist views. Press ? any time for a how-to, and Ctrl+K to search.' },
]

export default function QuickTour({ open, onClose }) {
  const [i, setI] = useState(0)
  const s = steps[i]
  const last = i === steps.length - 1
  const close = () => { setI(0); onClose() }
  return (
    <Modal open={open} onClose={close} title={`Quick tour · ${i + 1}/${steps.length}`}>
      <div className="flex flex-col items-center py-4 text-center">
        <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600"><s.icon size={28} /></span>
        <p className="text-lg font-extrabold">{s.title}</p>
        <p className="mt-2 max-w-sm text-sm text-muted">{s.text}</p>
      </div>
      <div className="mb-5 flex justify-center gap-1.5">
        {steps.map((_, n) => <span key={n} className={`h-1.5 rounded-full transition-all ${n === i ? 'w-6 bg-brand-600' : 'w-1.5 bg-slate-200'}`} />)}
      </div>
      <div className="flex justify-between">
        <Button variant="ghost" onClick={close}>Skip</Button>
        <div className="flex gap-2">
          {i > 0 && <Button variant="secondary" onClick={() => setI(i - 1)}>Back</Button>}
          <Button onClick={() => (last ? close() : setI(i + 1))}>{last ? 'Get started' : 'Next'}</Button>
        </div>
      </div>
    </Modal>
  )
}
