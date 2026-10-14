import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const PORT = 3096
const base = `http://localhost:${PORT}/api`
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'niera-uploads-'))
let server

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64, 1)])
const PDF = Buffer.from('%PDF-1.4\n%%EOF\n')
const upload = async (patientId, bytes, { name = 'scan.png', type = 'image/png', category = 'prescription', field = 'file' } = {}) => {
  const form = new FormData()
  if (category) form.set('category', category)
  form.set(field, new Blob([bytes], { type }), name)
  const res = await fetch(`${base}/patients/${patientId}/documents`, { method: 'POST', body: form })
  return { status: res.status, body: await res.json() }
}
const json = async (method, p) => { const res = await fetch(base + p, { method }); return { status: res.status, body: await res.json().catch(() => null) } }
const files = () => fs.readdirSync(dir)

before(async () => {
  server = spawn('node', ['server/index.js'], { env: { ...process.env, PORT: String(PORT), UPLOAD_DIR: dir }, stdio: 'ignore' })
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(`${base}/doctors`)).ok) return } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 100))
  }
  throw new Error('server did not start')
})
after(() => { server.kill(); fs.rmSync(dir, { recursive: true, force: true }) })

test('accepts a real image, names it randomly, serves it back with the detected type', async () => {
  const r = await upload(1, PNG, { name: '../../etc/passwd.png' })
  assert.equal(r.status, 201)
  assert.equal(r.body.mime, 'image/png')
  assert.equal(r.body.name, 'passwd.png', 'client path is stripped from the display name')
  assert.equal(r.body.filename, undefined, 'stored filename is never exposed')
  const [stored] = files()
  assert.match(stored, /^[0-9a-f-]{36}\.png$/)
  const got = await fetch(`http://localhost:${PORT}${r.body.url}`)
  assert.equal(got.status, 200)
  assert.equal(got.headers.get('content-type'), 'image/png')
  assert.deepEqual(Buffer.from(await got.arrayBuffer()), PNG)
  assert.equal(got.headers.get('x-content-type-options'), 'nosniff')
})

test('rejects files whose bytes do not match, whatever the name or declared type says', async () => {
  const before = files().length
  assert.equal((await upload(1, Buffer.from('<script>alert(1)</script>'), { name: 'evil.png', type: 'image/png' })).status, 415)
  assert.equal((await upload(1, Buffer.from('MZ\x90\x00 fake exe'), { name: 'a.pdf', type: 'application/pdf' })).status, 415)
  assert.equal((await upload(1, PNG, { name: 'x.gif', type: 'image/gif' })).status, 415, 'declared type not allowed')
  assert.equal((await upload(1, PNG, { name: 'x.svg', type: 'image/svg+xml' })).status, 415)
  assert.equal(files().length, before, 'nothing rejected is left on disk')
})

test('accepts pdf, enforces the 5 MB cap, validates category and field name', async () => {
  assert.equal((await upload(1, PDF, { name: 'r.pdf', type: 'application/pdf', category: 'report' })).status, 201)
  const big = Buffer.concat([PNG, Buffer.alloc(5 * 1024 * 1024)])
  assert.equal((await upload(1, big)).status, 413)
  assert.equal((await upload(1, PNG, { category: 'selfie' })).status, 400)
  assert.equal((await upload(1, PNG, { category: null })).status, 400)
  assert.equal((await upload(1, PNG, { field: 'other' })).status, 400)
})

test('unknown patient or document is 404; list and delete work; delete removes the file', async () => {
  assert.equal((await upload(9999, PNG)).status, 404)
  assert.equal((await json('GET', '/patients/9999/documents')).status, 404)
  const list = (await json('GET', '/patients/1/documents')).body
  assert.equal(list.length, 2)
  assert.equal((await json('GET', '/patients/2/documents/' + list[0].id + '/file')).status, 404, 'document of another patient')
  assert.equal((await json('DELETE', `/patients/1/documents/${list[0].id}`)).status, 200)
  assert.equal(files().length, 1)
  assert.equal((await json('DELETE', `/patients/1/documents/${list[0].id}`)).status, 404)
})

test('demo reset clears the uploads', async () => {
  assert.equal((await upload(3, PNG)).status, 201)
  assert.ok(files().length >= 2)
  await json('POST', '/demo/reset')
  assert.equal(files().length, 0)
  assert.equal((await json('GET', '/patients/1/documents')).body.length, 0)
})

test('per-patient cap, and deleting a patient purges their files after the undo window', async () => {
  await json('POST', '/demo/reset')
  const id = (await json('GET', '/patients')).body.find((p) => p.status === 'outpatient').id // admitted patients cannot be deleted
  for (let i = 0; i < 20; i++) assert.equal((await upload(id, PNG)).status, 201)
  assert.equal((await upload(id, PNG)).status, 409)
  assert.equal((await json('DELETE', `/patients/${id}`)).status, 200)
  assert.equal((await json('GET', `/patients/${id}/documents`)).status, 404, 'hidden while the patient is deleted')
  assert.equal(files().length, 20, 'still on disk during the undo window')
  await new Promise((r) => setTimeout(r, 6500))
  assert.equal(files().length, 0)
})
