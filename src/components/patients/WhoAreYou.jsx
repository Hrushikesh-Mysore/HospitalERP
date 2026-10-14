// Patient entry screen: pick a demo patient, sign in with name + phone, or register.
import { useState } from 'react'
import { HeartPulse, UserRound, AlertCircle } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Field, { inputCls } from '../ui/Field'
import RoleSwitcher from '../layout/RoleSwitcher'
import { useFetch } from '../../lib/useFetch'
import { useRole } from '../../lib/roleStore'
import { api } from '../../lib/api'

// Patient role entry: pick a demo patient, or sign in with name + phone, or register as new.
// Demo-level identity: see server/patientAccess.js.
export default function WhoAreYou() {
  const { setPatient } = useRole()
  const demo = useFetch('/portal/demo')
  const [f, setF] = useState({ name: '', phone: '', age: '', gender: 'F' })
  const [register, setRegister] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const enter = ({ patient, token }) => setPatient({ id: patient.id, name: patient.name, token })
  const run = async (fn) => {
    setBusy(true); setError('')
    try { enter(await fn()) } catch (e) {
      setError(e.message)
      if (e.status === 404 && !register) setRegister(true) // not found: offer to register
    } finally { setBusy(false) }
  }
  const submit = (e) => {
    e.preventDefault()
    run(() => register
      ? api('/portal/register', { method: 'POST', body: { name: f.name.trim(), phone: f.phone.trim(), age: Number(f.age), gender: f.gender } })
      : api('/portal/login', { method: 'POST', body: { name: f.name.trim(), phone: f.phone.trim() } }))
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col gap-5 p-4 pb-10">
      <div className="flex items-center justify-between gap-2 pt-2">
        <span className="flex items-center gap-2 text-lg font-extrabold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-on-brand"><HeartPulse size={20} /></span> MediCore</span>
        <RoleSwitcher />
      </div>
      <div>
        <h1 className="text-2xl font-extrabold">Who are you?</h1>
        <p className="text-sm text-muted">Pick a demo patient, or sign in with your name and phone number.</p>
      </div>

      <Card title="Demo patients">
        <div className="space-y-2">
          {(demo.data ?? []).map((p) => (
            <button key={p.id} disabled={busy} onClick={() => run(() => api('/portal/demo-login', { method: 'POST', body: { patientId: p.id } }))}
              className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface p-3 text-left hover:border-brand-500">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700"><UserRound size={20} /></span>
              <span className="min-w-0 flex-1"><b className="block truncate">{p.name}</b><span className="text-xs text-muted">Has an appointment and a queue token</span></span>
            </button>
          ))}
          {demo.error && <p className="text-sm text-danger">{demo.error}</p>}
        </div>
      </Card>

      <Card title={register ? 'Register as a new patient' : 'Sign in'}>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Full name"><input className={inputCls} value={f.name} onChange={set('name')} autoComplete="name" required minLength={2} maxLength={80} /></Field>
          <Field label="Phone number"><input className={inputCls} value={f.phone} onChange={set('phone')} autoComplete="tel" inputMode="tel" placeholder="555-0100" required minLength={5} maxLength={20} /></Field>
          {register && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Age"><input className={inputCls} type="number" inputMode="numeric" min={0} max={120} value={f.age} onChange={set('age')} required /></Field>
              <Field label="Gender">
                <select className={inputCls} value={f.gender} onChange={set('gender')}><option value="F">Female</option><option value="M">Male</option><option value="O">Other</option></select>
              </Field>
            </div>
          )}
          {error && <p role="alert" className="flex items-start gap-2 rounded-xl bg-danger-soft p-3 text-sm font-medium text-danger"><AlertCircle size={16} className="mt-0.5 shrink-0" />{error}</p>}
          <Button type="submit" disabled={busy} className="w-full">{busy ? 'Please wait…' : register ? 'Register and continue' : 'Sign in'}</Button>
          <button type="button" onClick={() => { setRegister(!register); setError('') }} className="tap-auto w-full text-center text-sm font-semibold text-brand-700 underline">
            {register ? 'I already have an account' : "I'm new here - register"}
          </button>
        </form>
      </Card>
    </div>
  )
}
