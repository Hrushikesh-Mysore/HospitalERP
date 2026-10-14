// The single fetch wrapper for /api: adds role headers, handles JSON/FormData and turns errors into Error objects.
import { actor } from './actor'

// anon: for the public pages (token slip, waiting-room board). They show the same to everyone, so they must not
// depend on whichever role this browser last used.
export async function api(path, { method = 'GET', body, anon = false } = {}) {
  const isForm = body instanceof FormData // multipart: let the browser set the boundary header
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      ...(!anon && { 'X-Role': actor.role }),
      ...(!anon && actor.role === 'Doctor' && { 'X-Doctor-Id': String(actor.doctorId) }),
      ...(!anon && actor.role === 'Patient' && actor.patientToken && { 'X-Patient-Token': actor.patientToken }),
      ...(body && !isForm && { 'Content-Type': 'application/json' }),
    },
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (res.status === 401 && !anon && actor.role === 'Patient') window.dispatchEvent(new Event('patient-session-ended')) // stale session: back to "Who are you?"
  if (!res.ok) throw Object.assign(new Error(data.details?.join(', ') || data.error || 'Request failed'), { flow: data.flow, bedId: data.bedId, status: res.status })
  return data
}
