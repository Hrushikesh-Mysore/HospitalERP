import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import { resetDb } from './data/store.js'
import stats from './routes/stats.js'
import patients from './routes/patients.js'
import doctors from './routes/doctors.js'
import appointments from './routes/appointments.js'
import beds from './routes/beds.js'
import emergency from './routes/emergency.js'

const app = express()
app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }))
app.use('/api', rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: true, legacyHeaders: false }))
app.use(express.json({ limit: '10kb' }))

app.use('/api/stats', stats)
app.use('/api/patients', patients)
app.use('/api/doctors', doctors)
app.use('/api/appointments', appointments)
app.use('/api/beds', beds)
app.use('/api/emergency', emergency)
app.post('/api/demo/reset', (req, res) => { resetDb(); res.json({ ok: true }) })

app.use(notFound)
app.use(errorHandler)

const port = process.env.PORT || 3001
app.listen(port, () => console.log(`API on http://localhost:${port}`))
