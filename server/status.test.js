import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const PORT = 3094
const base = `http://localhost:${PORT}/api`
let server

const asDoctor = (id) => ({ 'X-Role': 'Doctor', 'X-Doctor-Id': String(id) })
const ADMIN = { 'X-Role': 'Admin' }
const RECEPTION = { 'X-Role': 'Receptionist' }
const call = async (method, p, body, headers = {}) => {
  const res = await fetch(base + p, { method, headers: { ...(body && { 'Content-Type': 'application/json' }), ...headers }, body: body && JSON.stringify(body) })
  return { status: res.status, body: await res.json().catch(() => null) }
}
const appts = async () => (await call('GET', '/appointments')).body
const patients = async () => (await call('GET', '/patients')).body

before(async () => {
  server = spawn('node', ['server/index.js'], { env: { ...process.env, PORT: String(PORT), UPLOAD_DIR: fs.mkdtempSync(path.join(os.tmpdir(), 'niera-st-')) }, stdio: 'ignore' })
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(`${base}/doctors`)).ok) return } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 100))
  }
  throw new Error('server did not start')
})
after(() => server.kill())

const openAppt = async () => (await appts()).find((a) => a.status === 'scheduled' && a.date >= new Date().toISOString().slice(0, 10))

test('appointment: valid chain scheduled -> checked-in -> in-consult -> completed, with history', async () => {
  await call('POST', '/demo/reset')
  const a = await openAppt()
  const as = asDoctor(a.doctorId)
  const r1 = await call('PATCH', `/appointments/${a.id}/status`, { status: 'checked-in', note: 'Arrived at desk' }, as)
  assert.equal(r1.status, 200)
  assert.equal(r1.body.status, 'checked-in')
  assert.equal((await call('PATCH', `/appointments/${a.id}/status`, { status: 'in-consult' }, as)).status, 200)
  const done = await call('PATCH', `/appointments/${a.id}/status`, { status: 'completed' }, as)
  assert.equal(done.status, 200)
  const h = done.body.statusHistory
  assert.deepEqual(h.map((x) => [x.from, x.to]), [['scheduled', 'checked-in'], ['checked-in', 'in-consult'], ['in-consult', 'completed']])
  assert.equal(h[0].note, 'Arrived at desk')
  assert.equal(h[0].by.role, 'Doctor')
  assert.equal(h[0].by.doctorId, a.doctorId)
  assert.ok(h[0].at)
})

test('appointment: invalid moves are 409 with a clear message', async () => {
  await call('POST', '/demo/reset')
  const all = await appts()
  const done = all.find((a) => a.status === 'completed')
  const as = asDoctor(done.doctorId)
  const back = await call('PATCH', `/appointments/${done.id}/status`, { status: 'scheduled' }, as)
  assert.equal(back.status, 409)
  assert.match(back.body.error, /completed to scheduled/)
  assert.match(back.body.error, /final status/)
  const open = await openAppt()
  const skip = await call('PATCH', `/appointments/${open.id}/status`, { status: 'completed' }, asDoctor(open.doctorId))
  assert.equal(skip.status, 409, 'cannot jump scheduled -> completed')
  assert.match(skip.body.error, /you can go to: .*checked-in/)
  const cancelled = all.find((a) => a.status === 'cancelled')
  assert.equal((await call('PATCH', `/appointments/${cancelled.id}/status`, { status: 'scheduled' }, asDoctor(cancelled.doctorId))).status, 409)
  assert.equal((await call('PATCH', `/appointments/${open.id}/status`, { status: 'bogus' }, asDoctor(open.doctorId))).status, 400)
  assert.equal((await call('PATCH', `/appointments/${open.id}/status`, { status: 'checked-in', note: 'x'.repeat(201) }, asDoctor(open.doctorId))).status, 400, 'note max 200')
})

test('appointment: permissions - wrong doctor, reception, patient and missing role are 403; admin is fine', async () => {
  await call('POST', '/demo/reset')
  const a = await openAppt()
  const other = a.doctorId === 1 ? 2 : 1
  const url = `/appointments/${a.id}/status`
  const wrong = await call('PATCH', url, { status: 'checked-in' }, asDoctor(other))
  assert.equal(wrong.status, 403)
  assert.match(wrong.body.error, /your own/)
  assert.equal((await call('PATCH', url, { status: 'checked-in' }, RECEPTION)).status, 403)
  assert.equal((await call('PATCH', url, { status: 'checked-in' }, { 'X-Role': 'Patient' })).status, 403)
  assert.equal((await call('PATCH', url, { status: 'checked-in' })).status, 403)
  assert.equal((await call('PATCH', url, { status: 'checked-in' }, { 'X-Role': 'Doctor' })).status, 403, 'doctor without an id')
  assert.equal((await appts()).find((x) => x.id === a.id).status, 'scheduled', 'nothing changed')
  assert.equal((await call('PATCH', url, { status: 'checked-in' }, ADMIN)).status, 200)
})

test('patient status: valid change with note; admitted and discharged cannot be set directly', async () => {
  await call('POST', '/demo/reset')
  const p = (await patients()).find((x) => x.status === 'outpatient')
  const url = `/patients/${p.id}/status`
  const as = asDoctor(p.doctorId)
  const ok = await call('PATCH', url, { status: 'under-observation', note: 'Monitor BP' }, as)
  assert.equal(ok.status, 200)
  assert.equal(ok.body.status, 'under-observation')
  assert.equal(ok.body.statusHistory[0].note, 'Monitor BP')

  const admit = await call('PATCH', url, { status: 'admitted' }, as)
  assert.equal(admit.status, 409)
  assert.equal(admit.body.flow, 'admit', 'points at the bed admit flow')
  assert.equal((await patients()).find((x) => x.id === p.id).status, 'under-observation')
  const disc = await call('PATCH', url, { status: 'discharged' }, as)
  assert.equal(disc.status, 409)
  assert.equal((await call('PATCH', url, { status: 'sleeping' }, as)).status, 400)
  assert.equal((await call('PATCH', url, { status: 'referred' }, RECEPTION)).status, 403)
  const wrongDoc = await call('PATCH', url, { status: 'referred' }, asDoctor(p.doctorId === 1 ? 2 : 1))
  assert.equal(wrongDoc.status, 403)
})

test('patient status never desyncs beds: admit/discharge only via the bed flow, history records both', async () => {
  await call('POST', '/demo/reset')
  const p = (await patients()).find((x) => x.status === 'outpatient')
  const as = asDoctor(p.doctorId)
  const bed = (await call('GET', '/beds')).body.find((b) => b.status === 'free')

  const adm = await call('POST', `/beds/${bed.id}/admit`, { patientId: p.id, note: 'Chest pain' }, as)
  assert.equal(adm.status, 200)
  let now = (await patients()).find((x) => x.id === p.id)
  assert.equal(now.status, 'admitted')
  assert.equal(now.bedId, bed.id)

  // an admitted patient cannot be edited out of "admitted" through the status endpoint (bed would stay occupied)
  const sneaky = await call('PATCH', `/patients/${p.id}/status`, { status: 'outpatient' }, as)
  assert.equal(sneaky.status, 409)
  assert.equal(sneaky.body.flow, 'discharge')
  assert.equal(sneaky.body.bedId, bed.id)
  now = (await patients()).find((x) => x.id === p.id)
  assert.equal(now.status, 'admitted')
  assert.equal((await call('GET', '/beds')).body.find((b) => b.id === bed.id).status, 'occupied')

  const dis = await call('POST', `/beds/${bed.id}/discharge`, { note: 'Recovered' }, as)
  assert.equal(dis.status, 200)
  now = (await patients()).find((x) => x.id === p.id)
  assert.equal(now.status, 'discharged')
  assert.deepEqual(now.statusHistory.map((h) => [h.from, h.to, h.note]), [['outpatient', 'admitted', 'Chest pain'], ['admitted', 'discharged', 'Recovered']])
  assert.equal((await call('POST', `/beds/${bed.id}/discharge`, undefined)).status, 409, 'discharge with no body still works as before (bed is now empty)')
  assert.equal((await call('PATCH', `/patients/${p.id}/status`, { status: 'outpatient' }, as)).status, 200, 'discharged -> outpatient is fine')
})

test('status changes are broadcast over SSE, tokens keep a note, and reset clears history', async () => {
  await call('POST', '/demo/reset')
  const a = await openAppt()
  const ctrl = new AbortController()
  const res = await fetch(`${base}/events`, { signal: ctrl.signal })
  const reader = res.body.getReader()
  const seen = []
  const pump = (async () => {
    const dec = new TextDecoder()
    try { for (;;) { const { value, done } = await reader.read(); if (done) break; seen.push(dec.decode(value)) } } catch { /* aborted */ }
  })()
  await new Promise((r) => setTimeout(r, 200))
  await call('PATCH', `/appointments/${a.id}/status`, { status: 'checked-in' }, asDoctor(a.doctorId))
  const p = (await patients()).find((x) => x.status === 'outpatient')
  await call('PATCH', `/patients/${p.id}/status`, { status: 'referred' }, ADMIN)
  await new Promise((r) => setTimeout(r, 300))
  ctrl.abort(); await pump
  const events = seen.join('')
  assert.match(events, /"resource":"appointments"/)
  assert.match(events, /"resource":"patients"/)

  const t = (await call('POST', '/tokens', { doctorId: 3, name: 'Tok Note' })).body
  await call('POST', '/tokens/doctors/3/call-next')
  const started = await call('POST', `/tokens/${t.id}/start`, { note: 'Started late' }, asDoctor(3))
  assert.equal(started.body.statusHistory.at(-1).note, 'Started late')
  assert.equal(started.body.statusHistory.at(-1).by.doctorId, 3)

  await call('POST', '/demo/reset')
  assert.equal((await appts()).find((x) => x.id === a.id).statusHistory, undefined)
  assert.equal((await patients()).find((x) => x.id === p.id).statusHistory, undefined)
})
