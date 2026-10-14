import { lazy, Suspense } from 'react'
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
const Book = lazy(() => import('./pages/Book'))
const MyToken = lazy(() => import('./pages/MyToken'))
const Prescriptions = lazy(() => import('./pages/Prescriptions'))
const Queue = lazy(() => import('./pages/Queue'))
const Display = lazy(() => import('./pages/Display'))
const TokenStatus = lazy(() => import('./pages/TokenStatus'))

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
              <Route path="queue" element={<Queue />} />
              <Route path="book" element={<Book />} />
              <Route path="my-token" element={<MyToken />} />
              <Route path="prescriptions" element={<Prescriptions />} />
            </Route>
            <Route path="display" element={<Suspense fallback={null}><Display /></Suspense>} />
            <Route path="token/:ref?" element={<Suspense fallback={null}><TokenStatus /></Suspense>} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </RoleProvider>
    </ThemeProvider>
  )
}
