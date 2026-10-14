import { Users, BedDouble, CalendarDays, Activity, UserPlus, Siren, LogOut, Sparkles } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import Card from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import Skeleton from '../components/ui/Skeleton'
import { useFetch } from '../lib/useFetch'
import { useLiveSync } from '../lib/useLiveSync'
import Button from '../components/ui/Button'
import PageHeader from '../components/ui/PageHeader'
import DayTick from '../components/overview/DayTick'
import LiveDate from '../components/overview/LiveDate'
import EmptyState from '../components/ui/EmptyState'
import DoctorWidgets from '../components/overview/DoctorWidgets'
import ReceptionWidgets from '../components/overview/ReceptionWidgets'
import { Clock, UserCheck, ClipboardList } from 'lucide-react'
import { useChartColors } from '../lib/useChartColors'
import { useRole } from '../lib/roleStore'
import { todayISO } from '../lib/dates'
import { feedTones } from '../lib/status'

const ago = (iso) => {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000))
  return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} hr ago`
}

const icons = { users: Users, bed: BedDouble, calendar: CalendarDays, activity: Activity, clock: Clock, check: UserCheck, list: ClipboardList }
const feedIcons = { admit: UserPlus, appt: CalendarDays, alert: Siren, discharge: LogOut, bed: Sparkles }

export default function Overview() {
  const { role, doctorId } = useRole()
  const c = useChartColors()
  const tip = {
    contentStyle: { background: c.card, border: `1px solid ${c.grid}`, borderRadius: 12, color: c.ink },
    labelStyle: { color: c.ink, fontWeight: 600 },
    itemStyle: { color: c.ink },
  }
  const { data, error, loading, refetch } = useFetch(role === 'Doctor' ? `/stats?doctorId=${doctorId}` : '/stats')
  useLiveSync({ stats: refetch })

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
  const d = data.doctor
  const weekly = weeklyAdmissions.map((w) => ({ ...w, day: w.isToday ? 'Today (so far)' : w.day }))
  const nextLabel = d?.nextAppointment ? `${d.nextAppointment.time}${d.nextAppointment.date === todayISO() ? '' : ` · ${d.nextAppointment.date.slice(5)}`}` : 'None'
  const kpisByRole = {
    Admin: [
      { label: 'Total Patients', value: k.totalPatients, delta: `${k.admitted} admitted`, up: true, icon: 'users', tone: 'brand' },
      { label: 'Admitted Now', value: k.admitted, delta: `${k.occupancyPct}% occupancy`, up: true, icon: 'bed', tone: 'info' },
      { label: 'Appointments', value: k.appointments, delta: `${k.activeEmergencies} emergencies`, up: false, icon: 'calendar', tone: 'warn' },
      { label: 'Beds Available', value: k.bedsAvailable, delta: 'live', up: true, icon: 'activity', tone: 'ok' },
    ],
    Doctor: d ? [
      { label: 'My appointments today', value: d.appointmentsToday, icon: 'calendar', tone: 'brand' },
      { label: 'My admitted patients', value: d.admittedPatients, icon: 'bed', tone: 'info' },
      { label: d.nextAppointment ? `Next: ${d.nextAppointment.patient}` : 'Next appointment', value: nextLabel, icon: 'clock', tone: 'warn' },
    ] : [],
    Receptionist: [
      { label: "Today's registrations", value: k.registrationsToday, icon: 'check', tone: 'brand' },
      { label: 'Free beds', value: k.bedsAvailable, icon: 'bed', tone: 'ok' },
      { label: 'Pending bookings', value: k.pendingBookings, icon: 'list', tone: 'warn' },
    ],
  }
  const kpis = kpisByRole[role]
  return (
    <div className="space-y-6">
      <PageHeader
        title={role === 'Doctor' ? `Welcome, ${d?.doctor.name ?? 'Doctor'} 👋` : role === 'Receptionist' ? 'Front desk 👋' : 'Good morning 👋'}
        subtitle={role === 'Admin' ? "Here's what's happening at the hospital today." : role === 'Doctor' ? 'Your schedule and patients at a glance.' : 'Register patients and book appointments.'}
        action={<LiveDate />} />
      <div className={`grid gap-4 sm:grid-cols-2 ${role === 'Admin' ? 'xl:grid-cols-4' : 'xl:grid-cols-3'}`}>
        {kpis.map((k, i) => <StatCard key={k.label} {...k} index={i} icon={icons[k.icon]} />)}
      </div>
      {role === 'Doctor' && <DoctorWidgets />}
      {role === 'Receptionist' && <ReceptionWidgets />}
      {role === 'Admin' && <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Weekly admissions">
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} interval={0} height={44} tick={<DayTick fill={c.tick} />} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={32} allowDecimals={false} tick={{ fill: c.tick }} />
                <Tooltip {...tip} />
                <Line type="monotone" dataKey="admissions" stroke={c.line} strokeWidth={3} dot={{ r: 4, fill: c.card, stroke: c.line, strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Appointments by department">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={deptAppointments}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
                <XAxis dataKey="dept" tickLine={false} axisLine={false} fontSize={12} tick={{ fill: c.tick }} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={32} tick={{ fill: c.tick }} />
                <Tooltip {...tip} cursor={{ fill: c.cursor }} />
                <Bar dataKey="count" fill={c.bar} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>}
      <Card title="Recent activity">
        {activity.length === 0 && <EmptyState title="No activity yet" text="Admit a patient or book an appointment to see it here." />}
        <ul className="divide-y divide-line">
          {activity.map((a, i) => {
            const Icon = feedIcons[a.type]
            return (
              <li key={a.id} style={{ '--i': i }} className="rise flex items-center gap-3 py-3">
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
