import { LayoutDashboard, Users, CalendarDays, BedDouble, Siren, Ticket, CalendarPlus, FolderHeart } from 'lucide-react'

// Single source for navigation items, shared by the desktop sidebar and the phone tab bar.
export const navItems = [
  { to: '/', label: 'Overview', short: 'Home', icon: LayoutDashboard },
  { to: '/patients', label: 'Patients', icon: Users },
  { to: '/appointments', label: 'Appointments', short: 'Appts', icon: CalendarDays },
  { to: '/beds', label: 'Beds', icon: BedDouble },
  { to: '/queue', label: 'Queue', icon: Ticket },
  { to: '/emergency', label: 'Emergency', short: 'ER', icon: Siren },
  { to: '/book', label: 'Book', icon: CalendarPlus },
  { to: '/my-token', label: 'My Token', icon: Ticket },
  { to: '/records', label: 'My Records', short: 'Records', icon: FolderHeart },
]

const renames = {
  Doctor: { '/patients': 'My Patients', '/appointments': 'My Appointments', '/queue': 'My Queue' },
  Receptionist: { '/patients': 'Registration', '/appointments': 'Booking' },
}
export const navLabel = (item, role) => renames[role]?.[item.to] ?? item.label
