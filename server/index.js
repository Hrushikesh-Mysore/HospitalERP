// Server entry: wires security middleware, the role/patient checks, live-sync broadcast and every /api route, then listens on 0.0.0.0 and prints the LAN URL + QR.
import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { HttpError, errorHandler, notFound } from './middleware/errorHandler.js'
import qrcode from 'qrcode-terminal'
import { lanAddress } from './network.js'
import { eventsHandler, broadcastWrites } from './events.js'
import { resetDb } from './data/store.js'
import stats from './routes/stats.js'
import patients from './routes/patients.js'
import doctors from './routes/doctors.js'
import appointments from './routes/appointments.js'
import beds from './routes/beds.js'
import emergency from './routes/emergency.js'
import tokens from './routes/tokens.js'
import prescriptions from './routes/prescriptions.js'
import documents from './routes/documents.js'
import { readActor } from './actor.js'
import { patientGuard } from './patientAccess.js'
import portal from './routes/portal.js'
import statusRules from './routes/statusRules.js'
import { clearStaleUploads } from './uploads.js'

const app = express()
app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }))
app.get('/api/events', eventsHandler)
app.use('/api', rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: true, legacyHeaders: false }))
app.use(express.json({ limit: '10kb' }))
app.use('/api', readActor)
app.use('/api', patientGuard)
app.use('/api', broadcastWrites)

app.use('/api/portal', portal)
app.use('/api/status-rules', statusRules)
app.use('/api/stats', stats)
app.use('/api/patients/:id/documents', documents)
app.use('/api/patients', patients)
app.use('/api/doctors', doctors)
app.use('/api/appointments', appointments)
app.use('/api/beds', beds)
app.use('/api/emergency', emergency)
app.use('/api/tokens', tokens)
app.use('/api/prescriptions', prescriptions)
app.post('/api/demo/reset', (req, res) => {
  if (req.actor?.role === 'Patient') throw new HttpError(403, 'Patients cannot reset the demo.')
  resetDb(); res.json({ ok: true }) })

app.use(notFound)
app.use(errorHandler)

clearStaleUploads()
const port = process.env.PORT || 3001
const clientPort = process.env.CLIENT_PORT || 5173

app.listen(port, '0.0.0.0', () => {
  console.log(`API on http://localhost:${port}`)
  const ip = lanAddress()
  if (!ip) return console.log('No LAN address found - connect to Wi-Fi or a hotspot to open this on a phone.')
  const url = `http://${ip}:${clientPort}`
  console.log(`\nOpen on your phone (same network): ${url}\n`)
  qrcode.generate(url, { small: true })
})
