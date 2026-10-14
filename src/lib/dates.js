// Date helpers: today as YYYY-MM-DD, the next N days, and the long date label.
export const todayISO = () => new Date().toISOString().slice(0, 10)
export const daysFromNow = (n) => Array.from({ length: n }, (_, i) => new Date(Date.now() + i * 86400000))
const longDate = new Intl.DateTimeFormat('en', { weekday: 'long', day: 'numeric', month: 'long' })
export const formatToday = () => longDate.format(new Date())
