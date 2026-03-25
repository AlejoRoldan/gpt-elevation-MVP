import { Routes, Route, Navigate } from 'react-router-dom'
import { LandingPage }    from './pages/LandingPage.tsx'
import { LoginPage }      from './pages/LoginPage.tsx'
import { CheckinPage }    from './pages/CheckinPage.tsx'
import { ChatPage }       from './pages/ChatPage.tsx'
import { PricingPage }    from './pages/PricingPage.tsx'
import { ProtectedRoute } from './components/ProtectedRoute.tsx'
import { AdminRoute }     from './components/AdminRoute.tsx'

export default function App() {
  return (
    <Routes>
      <Route path="/"        element={<LandingPage />} />
      <Route path="/login"   element={<LoginPage />} />
      <Route path="/precios" element={<PricingPage />} />
      <Route path="/pricing" element={<PricingPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/app/checkin" element={<CheckinPage />} />
        <Route path="/app/chat"    element={<ChatPage />} />
      </Route>

      <Route path="/admin" element={
        <AdminRoute>
          <ChatPage />
        </AdminRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}