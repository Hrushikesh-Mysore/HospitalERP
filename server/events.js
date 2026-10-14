const clients = new Set()
const TYPES = { POST: 'created', PATCH: 'updated', PUT: 'updated', DELETE: 'deleted' }

export function broadcast(event) {
  const frame = `data: ${JSON.stringify(event)}\n\n`
  for (const res of clients) res.write(frame)
}

export function eventsHandler(req, res) {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })
  res.flushHeaders()
  res.write('retry: 3000\n\n')
  clients.add(res)
  req.on('close', () => clients.delete(res))
}

// After every successful POST/PATCH/DELETE under /api, tell clients which resource changed.
export function broadcastWrites(req, res, next) {
  const type = TYPES[req.method]
  if (type) {
    const resource = req.path.split('/')[1] // read now: Express restores the full path before 'finish'
    res.on('finish', () => {
      if (res.statusCode >= 400) return
      broadcast({ type, resource })
    })
  }
  next()
}

const heartbeat = setInterval(() => {
  for (const res of clients) res.write(': ping\n\n')
}, 25_000)
heartbeat.unref()
