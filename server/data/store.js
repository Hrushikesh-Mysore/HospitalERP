// The in-memory database (db), the soft-delete trash, resetDb and the activity log.
import { buildData } from './seed.js'
import { removeFile } from '../uploads.js'

export const db = buildData()
// Soft-deleted patients waiting out their undo window: id -> { patient, appointments, cases, timer }
export const trash = new Map()
export function resetDb() {
  trash.forEach((t) => clearTimeout(t.timer))
  trash.clear()
  db.documents?.forEach((d) => removeFile(d.filename))
  Object.assign(db, buildData())
}
export function logActivity(text, type) {
  db.activity.unshift({ id: Date.now() + Math.random(), text, type, at: new Date().toISOString() })
  db.activity.length = Math.min(db.activity.length, 20)
}
