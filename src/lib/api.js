export async function api(path, { method = 'GET', body } = {}) {
  const isForm = body instanceof FormData // multipart: let the browser set the boundary header
  const res = await fetch(`/api${path}`, {
    method,
    headers: body && !isForm ? { 'Content-Type': 'application/json' } : undefined,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.details?.join(', ') || data.error || 'Request failed')
  return data
}
