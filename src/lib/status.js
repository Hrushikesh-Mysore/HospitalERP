// Single source of truth for status / tone colors. Values live in index.css as theme tokens.
export const soft = {
  brand: 'bg-brand-50 text-brand-600',
  green: 'bg-ok-soft text-ok',
  amber: 'bg-warn-soft text-warn-ink',
  red: 'bg-danger-soft text-danger',
  blue: 'bg-info-soft text-info',
  gray: 'bg-neutral-soft text-muted',
}

export const isInactive = (status) => status === 'cancelled' || status === 'no-show'

export const statCardTone = { brand: 'brand', info: 'blue', warn: 'amber', ok: 'green' }

export const statusTone = { admitted: 'blue', outpatient: 'green', discharged: 'gray' }

export const bedStatus = {
  free: { tile: 'border-ok-line bg-ok-soft text-ok hover:bg-ok-hover', dot: 'bg-ok', label: 'Free' },
  occupied: { tile: 'border-danger-line bg-danger-soft text-danger hover:bg-danger-hover', dot: 'bg-danger', label: 'Occupied' },
  cleaning: { tile: 'border-warn-line bg-warn-soft text-warn-ink hover:bg-warn-hover', dot: 'bg-warn', label: 'Cleaning' },
}

export const triage = {
  1: { label: 'Critical', bar: 'bg-p1', chip: 'bg-p1-soft text-p1-ink' },
  2: { label: 'Urgent', bar: 'bg-p2', chip: 'bg-p2-soft text-p2-ink' },
  3: { label: 'Semi-urgent', bar: 'bg-p3', chip: 'bg-p3-soft text-p3-ink' },
  4: { label: 'Non-urgent', bar: 'bg-p4', chip: 'bg-p4-soft text-p4-ink' },
}

export const feedTones = { admit: soft.blue, appt: soft.brand, alert: soft.red, discharge: soft.green, bed: soft.amber }
