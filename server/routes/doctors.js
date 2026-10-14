// Doctors API: the doctor list and the bookable time slots.
import { Router } from 'express'
import { db } from '../data/store.js'
import { slots, departments } from '../data/seed.js'

const r = Router()
r.get('/', (req, res) => res.json({ doctors: db.doctors, slots, departments }))
export default r
