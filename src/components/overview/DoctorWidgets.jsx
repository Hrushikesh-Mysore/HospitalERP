import { CalendarDays, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import EmptyState from '../ui/EmptyState'
import Button from '../ui/Button'
import Skeleton from '../ui/Skeleton'
import { useFetch } from '../../lib/useFetch'
import { useLiveSync } from '../../lib/useLiveSync'
import { useRole } from '../../lib/roleStore'
import { statusTone } from '../../lib/status'

export default function DoctorWidgets() {
  const { doctorId } = useRole()
  const appts = useFetch('/appointments')
  const pts = useFetch('/patients')
  useLiveSync({ appointments: appts.refetch, patients: pts.refetch })
  if (appts.loading || pts.loading) return <div className="grid gap-6 xl:grid-cols-2"><Skeleton className="h-72" /><Skeleton className="h-72" /></div>
  const mine = (appts.data ?? []).filter((a) => a.doctorId === doctorId && a.status !== 'cancelled').sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
  const myPatients = (pts.data ?? []).filter((p) => p.doctorId === doctorId)
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card title="My appointments" action={<Link to="/appointments" className="text-sm font-semibold text-brand-600">View all</Link>}>
        {mine.length === 0 ? <EmptyState icon={CalendarDays} title="No appointments" text="Nothing scheduled for you yet." action={<Link to="/appointments"><Button>Open appointments</Button></Link>} /> : (
          <ul className="divide-y divide-line">{mine.slice(0, 6).map((a) => (
            <li key={a.id} className="flex items-center justify-between py-3 text-sm"><span><b>{a.time}</b> · {a.patient}<span className="block text-xs text-muted">{a.date}</span></span><Badge tone="blue">{a.status}</Badge></li>
          ))}</ul>
        )}
      </Card>
      <Card title="My patients" action={<Link to="/patients" className="text-sm font-semibold text-brand-600">View all</Link>}>
        {myPatients.length === 0 ? <EmptyState icon={Users} title="No patients assigned" action={<Link to="/patients"><Button>Open patients</Button></Link>} /> : (
          <ul className="divide-y divide-line">{myPatients.slice(0, 6).map((p) => (
            <li key={p.id} className="flex items-center justify-between py-3 text-sm"><span><b>{p.name}</b><span className="block text-xs text-muted">{p.condition}</span></span><Badge tone={statusTone[p.status]}>{p.status}</Badge></li>
          ))}</ul>
        )}
      </Card>
    </div>
  )
}
