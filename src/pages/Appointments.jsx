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
import StatusMenu from '../components/ui/StatusMenu'
import { apptTone, destructiveStatuses } from '../lib/status'
import { useFetch } from '../lib/useFetch'
import { useLiveSync } from '../lib/useLiveSync'
import { api } from '../lib/api'

// Front-desk quick actions. They are the valid next statuses from /api/status-rules, limited to what reception does;
// doctors and admins get the full status menu instead.
const frontDesk = ['confirmed', 'checked-in', 'cancelled', 'no-show']
const label = { confirmed: 'Confirm', 'checked-in': 'Check in', cancelled: 'Cancel', 'no-show': 'No-show' }
const iso = (d) => d.toISOString().slice(0, 10)

export default function Appointments() {
  const { role, doctorId } = useRole()
  const appts = useFetch('/appointments')
  const pts = useFetch('/patients')
  const docs = useFetch('/doctors')
  const rules = useFetch('/status-rules')
  useLiveSync({ appointments: appts.refetch, patients: pts.refetch })
  const toast = useToast()
  const days = useMemo(() => daysFromNow(7), [])
  const [date, setDate] = useState(iso(days[0]))
  const [booking, setBooking] = useState(false)

  const all = appts.data ?? []
  const day = all.filter((a) => a.date === date && (role !== 'Doctor' || a.doctorId === doctorId)).sort((a, b) => a.time.localeCompare(b.time))
  const byDoctor = (docs.data?.doctors ?? []).map((d) => ({ d, list: day.filter((a) => a.doctorId === d.id) })).filter((g) => g.list.length)

  const setStatus = async (a, status) => {
    try { await api(`/appointments/${a.id}`, { method: 'PATCH', body: { status } }); toast(status === 'cancelled' ? 'Appointment cancelled - slot is free' : `Marked ${status}`); appts.refetch() }
    catch (e) { toast(e.message, 'error') }
  }

  // Valid next statuses; no-show only makes sense once the appointment day has started
  const nextOf = (a) => (rules.data?.appointment[a.status] ?? []).filter((s) => s !== 'no-show' || a.date <= iso(days[0]))
  const actions = (a) => nextOf(a).filter((s) => frontDesk.includes(s))
  const canMenu = (a) => role === 'Admin' || (role === 'Doctor' && a.doctorId === doctorId)
  const applyStatus = (a) => async (option, { note }) => {
    await api(`/appointments/${a.id}/status`, { method: 'PATCH', body: { status: option.value, note } })
    toast(`Marked ${option.value}`)
    appts.refetch()
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
                      {canMenu(a)
                        ? <StatusMenu noun="appointment" value={a.status} tone={apptTone[a.status]} noteMax={rules.data?.noteMax}
                            options={nextOf(a).map((value) => ({ value, destructive: destructiveStatuses.includes(value) }))} onApply={applyStatus(a)} />
                        : <Badge tone={apptTone[a.status]}>{a.status}</Badge>}
                    </div>
                    <p className="text-xs text-muted">{a.reason}</p>
                    {!canMenu(a) && actions(a).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {actions(a).map((s) => (
                          <button key={s} onClick={() => setStatus(a, s)} className="rounded-lg border border-line bg-card px-2 py-1 text-xs font-semibold capitalize hover:bg-brand-50">{label[s]}</button>
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
