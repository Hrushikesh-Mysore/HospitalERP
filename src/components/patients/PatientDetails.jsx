import { Heart, Activity, Thermometer, Droplets, Pencil, Trash2 } from 'lucide-react'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import { statusTone } from '../../lib/status'

export default function PatientDetails({ patient: p, onEdit, onDelete }) {
  const vitals = [
    { label: 'Heart rate', value: `${p.vitals.heartRate} bpm`, icon: Heart },
    { label: 'Blood pressure', value: p.vitals.bp, icon: Activity },
    { label: 'Temperature', value: `${p.vitals.temp} °C`, icon: Thermometer },
    { label: 'SpO₂', value: `${p.vitals.spo2}%`, icon: Droplets },
  ]
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xl font-extrabold">{p.name}</p>
        <p className="text-sm text-muted">{p.age} yrs · {p.gender} · {p.phone}</p>
        <div className="mt-2"><Badge tone={statusTone[p.status]}>{p.status}</Badge></div>
        {(onEdit || onDelete) && (
          <div className="mt-3 flex gap-2">
            {onEdit && <Button variant="secondary" onClick={onEdit}><Pencil size={14} /> Edit</Button>}
            {onDelete && <Button variant="secondary" onClick={onDelete} className="!text-danger"><Trash2 size={14} /> Delete</Button>}
          </div>
        )}
      </div>
      <div className="rounded-2xl bg-surface p-4 text-sm">
        <p className="text-xs font-semibold text-muted">Condition</p><p className="font-semibold">{p.condition}</p>
        <p className="mt-3 text-xs font-semibold text-muted">Assigned doctor</p>
        <p className="font-semibold">{p.doctor?.name} <span className="font-normal text-muted">· {p.doctor?.department}</span></p>
      </div>
      <div>
        <p className="mb-2 text-sm font-bold">Vitals</p>
        <div className="grid grid-cols-2 gap-3">
          {vitals.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-line p-3">
              <Icon size={16} className="text-brand-600" />
              <p className="mt-1 text-lg font-bold">{value}</p>
              <p className="text-xs text-muted">{label}</p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-3 text-sm font-bold">History</p>
        <ol className="space-y-4 border-l-2 border-brand-100 pl-4">
          {[...p.history].reverse().map((h, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[22px] top-1 h-3 w-3 rounded-full border-2 border-card bg-brand-500" />
              <p className="text-sm font-semibold">{h.event}</p>
              <p className="text-xs text-muted">{h.date}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
