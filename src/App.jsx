import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Overview from './pages/Overview'
import Patients from './pages/Patients'
import Appointments from './pages/Appointments'
import Beds from './pages/Beds'
import Emergency from './pages/Emergency'
import { RoleProvider } from './lib/RoleContext'
import { ToastProvider } from './components/ui/Toast'

export default function App() {
  return (
    <RoleProvider>
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Overview />} />
            <Route path="patients" element={<Patients />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="beds" element={<Beds />} />
            <Route path="emergency" element={<Emergency />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
    </RoleProvider>
  )
}
