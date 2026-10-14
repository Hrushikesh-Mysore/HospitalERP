import { useMemo, useState } from 'react'
import { Plus, CalendarDays } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import PageHeader from '../components/ui/PageHeader'
import Badge from '../components/ui/Badge'
import Skeleton from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import { useToast } from '../lib/toastStore'
import BookAppointmentModal from '../components/appointments/BookAppointmentModal'
import { useRole } from '../lib/roleStore'
import { daysFromNow } from '../lib/dates'
import { useFetch } from '../lib/useFetch'
import { useLiveSync } from '../lib/useLiveSync'
import { api } from '../lib/api'

const tone = { scheduled: 'amber', confirmed: 'blue', completed: 'green', cancelled: 'red' }
const next = { scheduled: ['confirmed', 'cancelled'], confirmed: ['completed', 'cancelled'], completed: [], cancelled: [] }
const iso = (d) => d.toISOString().slice(0, 10)

export default function Appointments() {
  const { role, doctorId } = useRole()
  const appts = useFetch('/appointments')
  const pts = useFetch('/patients')
  const docs = useFetch('/doctors')
  useLiveSync({ appointments: appts.refetch, patients: pts.refetch })
  const toast = useToast()
  const days = useMemo(() => daysFromNow(7), [])
  const [date, setDate] = useState(iso(days[0]))
  const [booking, setBooking] = useState(false)

  const all = appts.data ?? []
  const day = all.filter((a) => a.date === date && (role !== 'Doctor' || a.doctorId === doctorId)).sort((a, b) => a.time.localeCompare(b.time))
  const byDoctor = (docs.data?.doctors ?? []).map((d) => ({ d, list: day.filter((a) => a.doctorId === d.id) })).filter((g) => g.list.length)

  const setStatus = async (a, status) => {
    try { await api(`/appointments/${a.id}`, { method: 'PATCH', body: { status } }); toast(`Marked ${status}`); appts.refetch() }
    catch (e) { toast(e.message, 'error') }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Appointments" subtitle={`${day.length} on ${date}`}
        action={<Button onClick={() => setBooking(true)}><Plus size={16} /> Book appointment</Button>} />
      <div className="flex gap-2 overflow-x-auto pb-1">
        {days.map((d) => {
          const k = iso(d), on = k === date
          return (
            <button key={k} onClick={() => setDate(k)} className={`min-w-16 shrink-0 rounded-2xl border px-3 py-2 text-center transition-all ${on ? 'border-brand-600 bg-brand-600 text-on-brand shadow-md' : 'border-line bg-card hover:bg-brand-50'}`}>
              <span className="block text-xs font-medium opacity-80">{d.toLocaleDateString('en', { weekday: 'short' })}</span>
              <span className="block text-lg font-extrabold">{d.getDate()}</span>
            </button>
          )
        })}
      </div>
      {appts.loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : appts.error ? (
        <Card><EmptyState title="Couldn't load appointments" text={appts.error} action={<Button onClick={appts.refetch}>Retry</Button>} /></Card>
      ) : byDoctor.length === 0 ? (
        <Card><EmptyState icon={CalendarDays} title="No appointments this day" text="Book the first one for this date." action={<Button onClick={() => setBooking(true)}><Plus size={16} /> Book appointment</Button>} /></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {byDoctor.map(({ d, list }) => (
            <Card key={d.id} title={d.name} action={<Badge tone="gray">{d.department}</Badge>}>
              <ol className="space-y-3 border-l-2 border-brand-100 pl-4">
                {list.map((a, i) => (
                  <li key={a.id} style={{ '--i': i }} className="rise relative rounded-xl bg-surface p-3">
                    <span className="absolute -left-[23px] top-4 h-3 w-3 rounded-full border-2 border-card bg-brand-500" />
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-bold">{a.time} · {a.patient}</p>
                      <Badge tone={tone[a.status]}>{a.status}</Badge>
                    </div>
                    <p className="text-xs text-muted">{a.reason}</p>
                    {next[a.status].length > 0 && (
                      <div className="mt-2 flex gap-2">
                        {next[a.status].map((s) => (
                          <button key={s} onClick={() => setStatus(a, s)} className="rounded-lg border border-line bg-card px-2 py-1 text-xs font-semibold capitalize hover:bg-brand-50">{s === 'cancelled' ? 'Cancel' : s === 'confirmed' ? 'Confirm' : 'Complete'}</button>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </Card>
          ))}
        </div>
      )}
      <BookAppointmentModal key={String(booking)} open={booking} onClose={() => setBooking(false)} date={date}
        patients={pts.data ?? []} doctors={docs.data?.doctors ?? []} slots={docs.data?.slots ?? []} booked={all} onBooked={appts.refetch} />
    </div>
  )
}
