import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function Layout() {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState('Admin')
  return (
    <div className="min-h-screen">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="lg:pl-64">
        <TopBar role={role} onRoleChange={setRole} onMenu={() => setOpen(true)} />
        <main className="p-4 lg:p-8"><Outlet context={{ role }} /></main>
      </div>
    </div>
  )
}
