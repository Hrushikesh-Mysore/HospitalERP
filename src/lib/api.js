import { actor } from './actor'

export async function api(path, { method = 'GET', body } = {}) {
  const isForm = body instanceof FormData // multipart: let the browser set the boundary header
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      'X-Role': actor.role,
      ...(actor.role === 'Doctor' && { 'X-Doctor-Id': String(actor.doctorId) }),
      ...(body && !isForm && { 'Content-Type': 'application/json' }),
    },
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(data.details?.join(', ') || data.error || 'Request failed'), { flow: data.flow, bedId: data.bedId })
  return data
}
