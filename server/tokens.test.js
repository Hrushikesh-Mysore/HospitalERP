import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'

const PORT = 3098
const base = `http://localhost:${PORT}/api`
let server

const call = async (method, path, body) => {
  const res = await fetch(base + path, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body && JSON.stringify(body) })
  return { status: res.status, body: await res.json() }
}
const issue = async (doctorId, name) => (await call('POST', '/tokens', { doctorId, name })).body
const queue = async (doctorId) => (await call('GET', `/tokens?doctorId=${doctorId}`)).body.doctors[0]

before(async () => {
  server = spawn('node', ['server/index.js'], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' })
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(`${base}/doctors`)).ok) return } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 100))
  }
  throw new Error('server did not start')
})
after(() => server.kill())

test('codes are per doctor, numbered server-side, and reset with the demo data', async () => {
  const a = await issue(2, 'Alice Ray')
  const b = await issue(2, 'Bob Kay')
  const c = await issue(3, 'Cy Lee')
  assert.deepEqual([a.code, b.code, c.code], ['D2-001', 'D2-002', 'D3-001'])
  await call('POST', '/demo/reset')
  assert.equal((await issue(2, 'Dee Roy')).code, 'D2-001')
  assert.equal((await queue(2)).waiting.length, 1)
})

test('call-next is strictly first come first served; one active patient at a time', async () => {
  await call('POST', '/demo/reset')
  const t = [await issue(4, 'P One'), await issue(4, 'P Two'), await issue(4, 'P Three')]
  const q = await queue(4)
  assert.deepEqual(q.waiting.map((x) => [x.code, x.position, x.estWaitMin]), [['D4-001', 1, 0], ['D4-002', 2, 10], ['D4-003', 3, 20]])

  const first = await call('POST', '/tokens/doctors/4/call-next')
  assert.equal(first.body.code, 'D4-001')
  assert.equal(first.body.status, 'called')
  assert.equal((await call('POST', '/tokens/doctors/4/call-next')).status, 409, 'cannot call another while one is active')

  assert.equal((await call('POST', `/tokens/${t[0].id}/finish`)).status, 409, 'must start before finishing')
  assert.equal((await call('POST', `/tokens/${t[0].id}/start`)).body.status, 'in-consult')
  // while someone is in consult, the person ahead counts toward the wait
  assert.deepEqual((await queue(4)).waiting.map((x) => [x.position, x.estWaitMin]), [[1, 10], [2, 20]])
  assert.equal((await call('POST', `/tokens/${t[0].id}/finish`)).body.status, 'done')

  assert.equal((await call('POST', '/tokens/doctors/4/call-next')).body.code, 'D4-002')
})

test('skipped tokens return to their original place, not the back of the line', async () => {
  await call('POST', '/demo/reset')
  const t = [await issue(5, 'A A'), await issue(5, 'B B'), await issue(5, 'C C')]
  await call('POST', '/tokens/doctors/5/call-next') // A called
  assert.equal((await call('POST', `/tokens/${t[0].id}/skip`)).body.status, 'skipped')
  assert.equal((await call('POST', '/tokens/doctors/5/call-next')).body.code, 'D5-002') // B jumps ahead of the skipped A
  await call('POST', `/tokens/${t[1].id}/skip`)
  await call('POST', `/tokens/${t[0].id}/recall`) // A back, before C
  const q = await queue(5)
  assert.deepEqual(q.waiting.map((x) => [x.code, x.position]), [['D5-001', 1], ['D5-003', 2]])
  assert.equal((await call('POST', '/tokens/doctors/5/call-next')).body.code, 'D5-001')
  assert.equal((await call('POST', `/tokens/${t[0].id}/recall`)).body.recalls, 1, 'recall on a called token re-announces it')
})

test('guards: duplicates, empty queue, bad input, doctors are independent', async () => {
  await call('POST', '/demo/reset')
  assert.equal((await call('POST', '/tokens/doctors/6/call-next')).status, 409)
  assert.equal((await call('POST', '/tokens', { doctorId: 6 })).status, 400)
  const p = await call('POST', '/tokens', { doctorId: 6, patientId: 1 })
  assert.equal(p.status, 201)
  assert.equal((await call('POST', '/tokens', { doctorId: 6, patientId: 1 })).status, 409, 'same patient cannot queue twice')
  await issue(7, 'Other Doc')
  await call('POST', '/tokens/doctors/6/call-next')
  assert.equal((await queue(7)).waiting[0].position, 1, 'another doctor queue is unaffected')
})

test('check-in from a booked appointment joins the back of the line (no jumping)', async () => {
  await call('POST', '/demo/reset')
  const today = new Date().toISOString().slice(0, 10)
  const appts = (await call('GET', '/appointments')).body
  const appt = appts.find((x) => x.date === today && ['scheduled', 'confirmed'].includes(x.status))
  assert.ok(appt, 'seed has an open appointment today')
  const walkin = await issue(appt.doctorId, 'Walk In')
  const checked = await call('POST', '/tokens', { appointmentId: appt.id })
  assert.equal(checked.status, 201)
  assert.equal(checked.body.seq, walkin.seq + 1)
  assert.equal(checked.body.position, 2)
  assert.equal((await call('POST', '/tokens', { appointmentId: appt.id })).status, 409)
})
