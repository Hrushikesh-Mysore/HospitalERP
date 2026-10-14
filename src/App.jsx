import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Overview from './pages/Overview'
import Patients from './pages/Patients'
import Appointments from './pages/Appointments'
import Placeholder from './pages/Placeholder'
import { ToastProvider } from './components/ui/Toast'

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Overview />} />
            <Route path="patients" element={<Patients />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="beds" element={<Placeholder title="Beds" />} />
            <Route path="emergency" element={<Placeholder title="Emergency" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
