import { buildData } from './seed.js'

export const db = buildData()
export function resetDb() {
  Object.assign(db, buildData())
}
export function logActivity(text, type) {
  db.activity.unshift({ id: Date.now() + Math.random(), text, type, at: new Date().toISOString() })
  db.activity.length = Math.min(db.activity.length, 20)
}
