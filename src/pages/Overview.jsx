import { Users, BedDouble, CalendarDays, Activity, UserPlus, Siren, LogOut, Sparkles } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import Card from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import Skeleton from '../components/ui/Skeleton'
import { useFetch } from '../lib/useFetch'
import Button from '../components/ui/Button'

const ago = (iso) => {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000))
  return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} hr ago`
}

const icons = { users: Users, bed: BedDouble, calendar: CalendarDays, activity: Activity }
const feedIcons = { admit: UserPlus, appt: CalendarDays, alert: Siren, discharge: LogOut, bed: Sparkles }
const feedTones = { admit: 'bg-blue-50 text-info', appt: 'bg-brand-50 text-brand-600', alert: 'bg-red-50 text-danger', discharge: 'bg-green-50 text-ok', bed: 'bg-amber-50 text-warn' }

export default function Overview() {
  const { data, error, loading, refetch } = useFetch('/stats', { interval: 10000 })

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-36" />)}</div>
        <div className="grid gap-6 xl:grid-cols-2"><Skeleton className="h-80" /><Skeleton className="h-80" /></div>
      </div>
    )
  }
  if (error && !data) {
    return (
      <Card className="mx-auto mt-12 max-w-md text-center">
        <p className="font-bold">Can't reach the server</p>
        <p className="mb-4 mt-1 text-sm text-muted">{error}. Is the API running? Try <code>npm run dev:all</code>.</p>
        <Button onClick={refetch}>Retry</Button>
      </Card>
    )
  }

  const { kpis: k, weeklyAdmissions, appointmentsByDept: deptAppointments, activity } = data
  const kpis = [
    { label: 'Total Patients', value: k.totalPatients, delta: `${k.admitted} admitted`, up: true, icon: 'users', tone: 'brand' },
    { label: 'Admitted Now', value: k.admitted, delta: `${k.occupancyPct}% occupancy`, up: true, icon: 'bed', tone: 'info' },
    { label: 'Appointments', value: k.appointments, delta: `${k.activeEmergencies} emergencies`, up: false, icon: 'calendar', tone: 'warn' },
    { label: 'Beds Available', value: k.bedsAvailable, delta: 'live', up: true, icon: 'activity', tone: 'ok' },
  ]
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Good morning 👋</h1>
        <p className="text-sm text-muted">Here's what's happening at the hospital today.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => <StatCard key={k.label} {...k} icon={icons[k.icon]} />)}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Weekly admissions">
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={weeklyAdmissions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf0" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={32} />
                <Tooltip />
                <Line type="monotone" dataKey="admissions" stroke="#0d9488" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Appointments by department">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={deptAppointments}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf0" vertical={false} />
                <XAxis dataKey="dept" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={32} />
                <Tooltip />
                <Bar dataKey="count" fill="#14b8a6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <Card title="Recent activity">
        <ul className="divide-y divide-line">
          {activity.map((a) => {
            const Icon = feedIcons[a.type]
            return (
              <li key={a.id} className="flex items-center gap-3 py-3">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${feedTones[a.type]}`}><Icon size={17} /></span>
                <p className="flex-1 text-sm font-medium">{a.text}</p>
                <span className="text-xs text-muted">{ago(a.at)}</span>
              </li>
            )
          })}
        </ul>
      </Card>
    </div>
  )
}
