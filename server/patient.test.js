import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const PORT = 3092
const base = `http://localhost:${PORT}/api`
let server

const call = async (method, p, body, headers = {}) => {
  const res = await fetch(base + p, { method, headers: { ...(body && { 'Content-Type': 'application/json' }), ...headers }, body: body && JSON.stringify(body) })
  return { status: res.status, body: await res.json().catch(() => ({})) }
}
const asPatient = (token) => ({ 'X-Role': 'Patient', 'X-Patient-Token': token })
const signIn = async (patientId) => (await call('POST', '/portal/demo-login', { patientId })).body
const future = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)

before(async () => {
  server = spawn('node', ['server/index.js'], { env: { ...process.env, PORT: String(PORT), UPLOAD_DIR: fs.mkdtempSync(path.join(os.tmpdir(), 'niera-pat-')) }, stdio: 'ignore' })
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(`${base}/doctors`)).ok) return } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 100))
  }
  throw new Error('server did not start')
})
after(() => server.kill())

test('sign-in: demo patients, name + phone match, unknown person, register', async () => {
  assert.equal((await call('GET', '/portal/demo')).body.length, 2)
  assert.equal((await call('POST', '/portal/demo-login', { patientId: 5 })).status, 404, 'only demo patients can use the shortcut')
  const demo = (await call('GET', '/portal/demo')).body[0]
  const ok = await call('POST', '/portal/login', { name: ` ${demo.name.toUpperCase()} `, phone: demo.phone.replace('-', ' ') })
  assert.equal(ok.status, 200); assert.equal(ok.body.patient.id, demo.id)
  assert.equal((await call('POST', '/portal/login', { name: demo.name, phone: '999-9999' })).status, 404)
  const reg = await call('POST', '/portal/register', { name: 'Zed Newcomer', phone: '555-7777', age: 31, gender: 'O' })
  assert.equal(reg.status, 201)
  assert.equal((await call('POST', '/portal/register', { name: 'Zed Newcomer', phone: '5557777', age: 31, gender: 'O' })).status, 409, 'already registered')
  assert.ok((await call('GET', '/patients')).body.some((p) => p.name === 'Zed Newcomer'), 'staff see the new patient')
})

test('a patient only reaches their own records; everything else is 403', async () => {
  const a = await signIn(38), b = await signIn(39)
  const H = asPatient(a.token)
  assert.equal((await call('GET', '/patients/38', undefined, H)).status, 200)
  assert.equal((await call('GET', '/patients/39', undefined, H)).status, 403)
  for (const p of ['/patients', '/beds', '/emergency', '/stats', '/patients/39/documents', '/prescriptions', '/prescriptions?patientId=39', '/tokens?patientId=39']) {
    assert.equal((await call('GET', p, undefined, H)).status, 403, `GET ${p}`)
  }
  assert.equal((await call('GET', '/prescriptions?patientId=38', undefined, H)).body.length, 1)
  assert.equal((await call('GET', '/patients/38/documents', undefined, H)).status, 200)
  assert.equal((await call('POST', '/beds/1/discharge', {}, H)).status, 403)
  assert.equal((await call('POST', '/demo/reset', undefined, H)).status, 403)
  assert.equal((await call('PATCH', '/patients/38/status', { status: 'referred' }, H)).status, 403)
  assert.equal((await call('POST', '/tokens/doctors/7/call-next', undefined, H)).status, 403)
  // forged id/header: a token only ever speaks for its own patient, an unknown token is 401, no token 403
  assert.equal((await call('GET', '/patients/38', undefined, asPatient('nope'))).status, 401)
  assert.equal((await call('GET', '/patients/38', undefined, { 'X-Role': 'Patient' })).status, 403)
  assert.equal((await call('GET', '/patients/38', undefined, { ...asPatient(b.token) })).status, 403)
})

test('booking: own id only, conflicts return 409 with a message, cancel own future appointment only', async () => {
  const a = await signIn(38), b = await signIn(39)
  const Ha = asPatient(a.token), Hb = asPatient(b.token)
  const slot = { doctorId: 1, date: future(3), time: '09:00' }
  assert.equal((await call('POST', '/appointments', { ...slot, patientId: 39 }, Ha)).status, 403, 'cannot book for someone else')
  const mine = await call('POST', '/appointments', { ...slot, patientId: 38 }, Ha)
  assert.equal(mine.status, 201)
  const clash = await call('POST', '/appointments', { ...slot, patientId: 39 }, Hb)
  assert.equal(clash.status, 409); assert.match(clash.body.error, /already booked/)

  const list = (await call('GET', '/appointments', undefined, Hb)).body
  const seen = list.find((x) => x.id === mine.body.id)
  assert.ok(seen && !('patientId' in seen) && !('patient' in seen) && !('reason' in seen), "others' appointments are slot info only")
  assert.ok('patientId' in list.find((x) => x.patientId === 39), 'own appointments are complete')

  assert.equal((await call('PATCH', `/appointments/${mine.body.id}`, { status: 'cancelled' }, Hb)).status, 403, "not someone else's")
  assert.equal((await call('PATCH', `/appointments/${mine.body.id}`, { status: 'confirmed' }, Ha)).status, 403, 'cancel only')
  assert.equal((await call('PATCH', `/appointments/${mine.body.id}`, { status: 'cancelled', time: '10:00' }, Ha)).status, 403, 'no rescheduling')
  assert.equal((await call('PATCH', `/appointments/${mine.body.id}/status`, { status: 'cancelled' }, Ha)).status, 403, 'staff endpoint stays closed')
  const done = await call('PATCH', `/appointments/${mine.body.id}`, { status: 'cancelled' }, Ha)
  assert.equal(done.status, 200); assert.equal(done.body.status, 'cancelled')
  assert.equal((await call('POST', '/appointments', { ...slot, patientId: 39 }, Hb)).status, 201, 'slot is free again')
})

test('tokens: own token with position and wait, other patients are anonymous, no check-in for others', async () => {
  const b = await signIn(39), Hb = asPatient(b.token)
  const q = (await call('GET', '/tokens?patientId=39', undefined, Hb)).body
  assert.equal(q.mine.length, 1)
  assert.equal(q.mine[0].position, 2); assert.equal(q.mine[0].ahead, 1); assert.equal(q.mine[0].estWaitMin, 10)
  const first = q.doctors.find((d) => d.id === 7).waiting[0]
  assert.equal(first.name, null); assert.equal(first.patientId, null)
  assert.equal((await call('POST', '/tokens', { appointmentId: 26 }, Hb)).status, 403, "cannot check in someone else's visit")
  assert.equal((await call('POST', '/tokens', { doctorId: 1, patientId: 38 }, Hb)).status, 403)
  assert.equal((await call('POST', '/tokens', { doctorId: 1, name: 'Anyone' }, Hb)).status, 403, 'walk-in must be for yourself')
  assert.equal((await call('POST', '/tokens', { doctorId: 1, patientId: 39 }, Hb)).status, 201)
})

test('reset restores the two demo patients with an appointment, a prescription and a token', async () => {
  await call('POST', '/demo/reset')
  const [x, y] = (await call('GET', '/portal/demo')).body
  const appts = (await call('GET', '/appointments')).body
  const tokens = (await call('GET', '/tokens')).body.doctors.flatMap((d) => d.waiting)
  const rx = (await call('GET', '/prescriptions')).body
  for (const p of [x, y]) {
    assert.ok(appts.some((a) => a.patientId === p.id && a.status !== 'cancelled'), `${p.name} appointment`)
    assert.ok(tokens.some((t) => t.patientId === p.id), `${p.name} token`)
    assert.ok(rx.some((r) => r.patientId === p.id), `${p.name} prescription`)
  }
})
