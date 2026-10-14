import { lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import ThemeProvider from './lib/ThemeProvider'
import { RoleProvider } from './lib/RoleContext'
import { ToastProvider } from './components/ui/Toast'

const Overview = lazy(() => import('./pages/Overview'))
const Patients = lazy(() => import('./pages/Patients'))
const Appointments = lazy(() => import('./pages/Appointments'))
const Beds = lazy(() => import('./pages/Beds'))
const Emergency = lazy(() => import('./pages/Emergency'))

export default function App() {
  return (
    <ThemeProvider>
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
    </ThemeProvider>
  )
}
