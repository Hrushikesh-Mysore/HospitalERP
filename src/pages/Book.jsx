import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarCheck, AlertCircle } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import Field, { inputCls } from '../components/ui/Field'
import { useFetch } from '../lib/useFetch'
import { useLiveSync } from '../lib/useLiveSync'
import { useRole } from '../lib/roleStore'
import { useToast } from '../lib/toastStore'
import { daysFromNow } from '../lib/dates'
import { isInactive, apptTone } from '../lib/status'
import { api } from '../lib/api'

const iso = (d) => d.toISOString().slice(0, 10)

// Patient role: book a visit, see upcoming ones, check in on the day.
export default function Book() {
  const { patientId } = useRole()
  const toast = useToast()
  const navigate = useNavigate()
  const appts = useFetch('/appointments')
  const docs = useFetch('/doctors')
  useLiveSync({ appointments: appts.refetch })
  const days = useMemo(() => daysFromNow(7), [])
  const [f, setF] = useState({ doctorId: '', date: iso(days[0]), time: '', reason: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const all = appts.data ?? []
  const taken = (t) => all.some((a) => a.doctorId === Number(f.doctorId) && a.date === f.date && a.time === t && !isInactive(a.status))
  const mine = all.filter((a) => a.patientId === patientId && a.date >= iso(days[0]) && !isInactive(a.status) && a.status !== 'completed').sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))

  const book = async (e) => {
    e.preventDefault()
    if (!f.doctorId) return setError('Pick a doctor')
    if (!f.time) return setError('Pick a time slot')
    setBusy(true); setError('')
    try {
      await api('/appointments', { method: 'POST', body: { patientId, doctorId: Number(f.doctorId), date: f.date, time: f.time, reason: f.reason.trim() || undefined } })
      toast('Appointment booked')
      setF({ ...f, time: '', reason: '' })
      appts.refetch()
    } catch (err) { setError(err.message); appts.refetch() }
    finally { setBusy(false) }
  }
  const cancel = async (a) => {
    try { await api(`/appointments/${a.id}`, { method: 'PATCH', body: { status: 'cancelled' } }); toast('Appointment cancelled'); appts.refetch() }
    catch (err) { toast(err.message, 'error') }
  }
  const checkIn = async (a) => {
    try { const t = await api('/tokens', { method: 'POST', body: { appointmentId: a.id } }); toast(`Checked in - token ${t.code}`); navigate('/my-token', { state: { fresh: t.id } }) }
    catch (err) { toast(err.message, 'error') }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Book a visit" subtitle="Pick a doctor, a day and a free time" />
      <Card>
        <form onSubmit={book} className="space-y-5">
          <Field label="Doctor">
            <select className={inputCls} value={f.doctorId} onChange={(e) => setF({ ...f, doctorId: e.target.value, time: '' })}>
              <option value="">Select a doctor…</option>
              {(docs.data?.doctors ?? []).map((d) => <option key={d.id} value={d.id}>{d.name} · {d.department}</option>)}
            </select>
          </Field>
          <div>
            <span className="mb-1 block text-xs font-semibold text-muted">Day</span>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {days.map((d) => {
                const k = iso(d), on = k === f.date
                return (
                  <button type="button" key={k} onClick={() => setF({ ...f, date: k, time: '' })} aria-pressed={on}
                    className={`min-w-16 shrink-0 rounded-2xl border px-3 py-2 text-center ${on ? 'border-brand-600 bg-brand-600 text-on-brand shadow-md' : 'border-line bg-card'}`}>
                    <span className="block text-xs font-medium opacity-80">{d.toLocaleDateString('en', { weekday: 'short' })}</span>
                    <span className="block text-lg font-extrabold">{d.getDate()}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <span className="mb-1 block text-xs font-semibold text-muted">Time</span>
            {!f.doctorId ? <p className="text-sm text-muted">Choose a doctor to see free slots.</p> : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {(docs.data?.slots ?? []).map((t) => (
                  <button type="button" key={t} disabled={taken(t)} aria-pressed={f.time === t} onClick={() => setF({ ...f, time: t })}
                    className={`rounded-xl border px-2 py-2 text-sm font-semibold ${f.time === t ? 'border-brand-600 bg-brand-600 text-on-brand' : 'border-line bg-card'} disabled:bg-surface disabled:text-muted disabled:line-through`}>{t}</button>
                ))}
              </div>
            )}
          </div>
          <Field label="Reason (optional)"><input className={inputCls} value={f.reason} maxLength={120} onChange={(e) => setF({ ...f, reason: e.target.value })} placeholder="Consultation" /></Field>
          {error && <p role="alert" className="flex items-start gap-2 rounded-xl bg-danger-soft p-3 text-sm font-medium text-danger"><AlertCircle size={16} className="mt-0.5 shrink-0" />{error}</p>}
          <Button type="submit" disabled={busy} className="w-full">{busy ? 'Booking…' : 'Confirm booking'}</Button>
        </form>
      </Card>

      <Card title="My appointments">
        {mine.length === 0 ? (
          <EmptyState icon={CalendarCheck} title="Nothing booked" text="Your upcoming visits show up here." />
        ) : (
          <ul className="space-y-3">
            {mine.map((a) => (
              <li key={a.id} className="rounded-xl bg-surface p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold">{a.date === iso(days[0]) ? 'Today' : a.date} · {a.time}</p>
                  <Badge tone={apptTone[a.status]}>{a.status}</Badge>
                </div>
                <p className="text-xs text-muted">{a.doctor?.name} · {a.reason}</p>
                <div className="mt-2 flex gap-2">
                  {a.date === iso(days[0]) && <Button onClick={() => checkIn(a)}>Check in</Button>}
                  <Button variant="secondary" onClick={() => cancel(a)}>Cancel</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
