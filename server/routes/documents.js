// Patient document uploads: list, upload (multer, signature check), serve and delete.
import { Router } from 'express'
import multer from 'multer'
import { z } from 'zod'
import { db, logActivity } from '../data/store.js'
import { find } from '../services.js'
import { HttpError } from '../middleware/errorHandler.js'
import { MAX_BYTES, detectType, saveFile, removeFile, filePath } from '../uploads.js'

const CATEGORIES = ['prescription', 'report', 'scan']
const MAX_PER_PATIENT = 20
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

// Memory storage: the bytes are checked before anything touches the disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1, fields: 4 },
  fileFilter: (req, file, cb) => (ALLOWED_MIME.includes(file.mimetype) ? cb(null, true) : cb(new HttpError(415, 'Only JPEG, PNG, WebP and PDF files are allowed'))),
})

const r = Router({ mergeParams: true })
const patientOf = (req) => find('patients', req.params.id, 'Patient')
const docOf = (req) => {
  const d = db.documents.find((x) => x.id === Number(req.params.docId) && x.patientId === Number(req.params.id))
  if (!d) throw new HttpError(404, 'Document not found')
  return d
}
const publicView = ({ filename: _stored, ...d }) => ({ ...d, url: `/api/patients/${d.patientId}/documents/${d.id}/file` })
const cleanName = (s = '') => s.replace(/[^\w .()-]/g, '').trim().slice(0, 80) || 'document'

r.get('/', (req, res) => {
  const p = patientOf(req)
  res.json(db.documents.filter((d) => d.patientId === p.id).sort((a, b) => b.id - a.id).map(publicView))
})

r.post('/', (req, res, next) => { patientOf(req); next() }, upload.single('file'), (req, res) => {
  const p = patientOf(req)
  const category = z.enum(CATEGORIES).safeParse(req.body.category)
  if (!category.success) throw new HttpError(400, `category must be one of: ${CATEGORIES.join(', ')}`)
  if (!req.file) throw new HttpError(400, 'No file received (use the "file" field)')
  const type = detectType(req.file.buffer)
  if (!type) throw new HttpError(415, 'That file is not a real JPEG, PNG, WebP or PDF')
  if (db.documents.filter((d) => d.patientId === p.id).length >= MAX_PER_PATIENT) throw new HttpError(409, `Limit of ${MAX_PER_PATIENT} documents per patient reached`)

  const d = {
    id: Math.max(0, ...db.documents.map((x) => x.id)) + 1, patientId: p.id, category: category.data, mime: type.mime,
    size: req.file.size, name: cleanName(req.file.originalname), uploadedAt: new Date().toISOString(),
    filename: saveFile(req.file.buffer, type.ext),
  }
  db.documents.push(d)
  logActivity(`${category.data} document added for ${p.name}`, 'admit')
  res.status(201).json(publicView(d))
})

// Streamed only after the patient and the document are both confirmed to exist.
r.get('/:docId/file', (req, res, next) => {
  patientOf(req)
  const d = docOf(req)
  res.set({ 'Content-Type': d.mime, 'Content-Disposition': 'inline', 'Cache-Control': 'private, max-age=300' })
  // Images can be fully locked down. PDFs keep helmet's default policy because browsers' built-in PDF viewers break under `sandbox`.
  if (d.mime !== 'application/pdf') res.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox")
  res.sendFile(filePath(d.filename), { acceptRanges: false }, (err) => err && next(new HttpError(404, 'File is missing')))
})

r.delete('/:docId', (req, res) => {
  patientOf(req)
  const d = docOf(req)
  removeFile(d.filename)
  db.documents = db.documents.filter((x) => x.id !== d.id)
  res.json({ ok: true, id: d.id })
})

export default r
