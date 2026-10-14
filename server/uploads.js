// Upload storage helpers: file signature detection, random file names, saving and removing files under server/uploads.
import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'

export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || path.join(path.dirname(fileURLToPath(import.meta.url)), 'uploads'))
export const MAX_BYTES = 5 * 1024 * 1024
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

// Server-generated names only: <uuid>.<ext>. Anything else in the folder is not ours to touch.
const OURS = /^[0-9a-f-]{36}\.(jpg|png|webp|pdf)$/

// What the file actually is, from its leading bytes. The client's filename and Content-Type are never trusted.
export function detectType(buf) {
  const at = (i, ...bytes) => bytes.every((b, k) => buf[i + k] === b)
  if (at(0, 0xff, 0xd8, 0xff)) return { mime: 'image/jpeg', ext: 'jpg' }
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return { mime: 'image/png', ext: 'png' }
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return { mime: 'image/webp', ext: 'webp' }
  if (at(0, 0x25, 0x50, 0x44, 0x46, 0x2d)) return { mime: 'application/pdf', ext: 'pdf' }
  return null
}

export const filePath = (filename) => {
  if (!OURS.test(filename)) throw new Error('Refusing to touch a file we did not name')
  return path.join(UPLOAD_DIR, filename)
}

export function saveFile(buf, ext) {
  const filename = `${randomUUID()}.${ext}`
  fs.writeFileSync(filePath(filename), buf, { flag: 'wx' })
  return filename
}

export const removeFile = (filename) => fs.rmSync(filePath(filename), { force: true })

// The database is in memory, so files left from a previous run are unreachable: clear them on start.
export function clearStaleUploads() {
  for (const f of fs.readdirSync(UPLOAD_DIR)) if (OURS.test(f)) fs.rmSync(path.join(UPLOAD_DIR, f), { force: true })
}
