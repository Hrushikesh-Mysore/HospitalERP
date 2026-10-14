export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status }
}
export const notFound = (req, res) => res.status(404).json({ error: 'Not found' })
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 413 : err.name === 'MulterError' ? 400 : err.type === 'entity.too.large' ? 413 : err.type === 'entity.parse.failed' ? 400 : 500)
  const message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (max 5 MB)' : status < 500 || err.status ? err.message : 'Internal server error'
  if (status >= 500) console.error(err.message)
  res.status(status).json({ error: message })
}
