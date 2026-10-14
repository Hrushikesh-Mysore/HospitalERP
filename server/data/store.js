import { buildData } from './seed.js'

export const db = buildData()
// Soft-deleted patients waiting out their undo window: id -> { patient, appointments, cases, timer }
export const trash = new Map()
export function resetDb() {
  trash.forEach((t) => clearTimeout(t.timer))
  trash.clear()
  Object.assign(db, buildData())
}
export function logActivity(text, type) {
  db.activity.unshift({ id: Date.now() + Math.random(), text, type, at: new Date().toISOString() })
  db.activity.length = Math.min(db.activity.length, 20)
}
