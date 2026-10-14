// Single source of truth for status / tone colors.
export const soft = {
  brand: 'bg-brand-50 text-brand-600',
  green: 'bg-green-50 text-ok',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-danger',
  blue: 'bg-blue-50 text-info',
  gray: 'bg-slate-100 text-muted',
}

export const statCardTone = { brand: 'brand', info: 'blue', warn: 'amber', ok: 'green' }

export const statusTone = { admitted: 'blue', outpatient: 'green', discharged: 'gray' }

export const bedStatus = {
  free: { tile: 'border-green-200 bg-green-50 text-ok hover:bg-green-100', dot: 'bg-green-400', label: 'Free' },
  occupied: { tile: 'border-red-200 bg-red-50 text-danger hover:bg-red-100', dot: 'bg-red-400', label: 'Occupied' },
  cleaning: { tile: 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100', dot: 'bg-amber-400', label: 'Cleaning' },
}

export const triage = {
  1: { label: 'Critical', bar: 'bg-red-500', chip: 'bg-red-100 text-red-700' },
  2: { label: 'Urgent', bar: 'bg-orange-500', chip: 'bg-orange-100 text-orange-700' },
  3: { label: 'Semi-urgent', bar: 'bg-yellow-400', chip: 'bg-yellow-100 text-yellow-700' },
  4: { label: 'Non-urgent', bar: 'bg-green-500', chip: 'bg-green-100 text-green-700' },
}

export const feedTones = { admit: soft.blue, appt: soft.brand, alert: soft.red, discharge: soft.green, bed: soft.amber }
