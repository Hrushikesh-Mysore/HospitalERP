import { Link } from 'react-router-dom'
import { UserPlus, CalendarPlus } from 'lucide-react'
import Card from '../ui/Card'

const actions = [
  { to: '/patients', icon: UserPlus, title: 'Register a patient', text: 'Add a new patient record' },
  { to: '/appointments', icon: CalendarPlus, title: 'Book an appointment', text: 'Pick a doctor and a free slot' },
]

export default function ReceptionWidgets() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {actions.map((a) => (
        <Link key={a.to} to={a.to}>
          <Card className="h-full transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md">
            <span className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600"><a.icon size={22} /></span>
            <p className="font-bold">{a.title}</p><p className="text-sm text-muted">{a.text}</p>
          </Card>
        </Link>
      ))}
    </div>
  )
}
