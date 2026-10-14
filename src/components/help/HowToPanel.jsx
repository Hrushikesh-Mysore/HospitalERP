import { CheckCircle2, PlayCircle } from 'lucide-react'
import SlideOver from '../ui/SlideOver'
import Button from '../ui/Button'
import { useRole } from '../../lib/roleStore'
import { roles } from '../../lib/roles'

const tasks = {
  Admin: ['Watch live KPIs and charts on Overview', 'Admit or discharge patients on the Beds page', 'Triage the Emergency queue and assign beds', 'Reset demo data from the sidebar when done'],
  Doctor: ['See your appointments and patients on Overview', 'Open My Patients and click a row for vitals and history', 'Confirm or complete your appointments in My Appointments'],
  Receptionist: ['Register a new patient under Registration', 'Book a visit under Booking: pick doctor, then a free slot', 'If a slot is taken, choose another when the conflict message shows'],
}

export default function HowToPanel({ open, onClose, onTour }) {
  const { role } = useRole()
  return (
    <SlideOver open={open} onClose={onClose} title="How to use MediCore">
      <Button variant="secondary" className="mb-6 w-full" onClick={onTour}><PlayCircle size={16} /> Replay quick tour</Button>
      {[role, ...roles.filter((r) => r !== role)].map((r) => (
        <section key={r} className="mb-6">
          <h3 className="mb-2 text-sm font-bold">{r}{r === role && <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">you</span>}</h3>
          <ul className="space-y-2">
            {tasks[r].map((t) => <li key={t} className="flex gap-2 text-sm text-muted"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand-500" />{t}</li>)}
          </ul>
        </section>
      ))}
    </SlideOver>
  )
}
