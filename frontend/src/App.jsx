import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import LoadingScreen from './components/LoadingScreen'

// Lazy load pages for performance optimization
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Auth = lazy(() => import('./pages/Auth'))
const History = lazy(() => import('./pages/History'))

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useSelector((state) => state.auth)
  if (loading) return <LoadingScreen />
  return user ? children : <Navigate to="/auth" />
}

function AppContent() {
  return (
    <Router>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/history" element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          } />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default function App() {
  return (
    <AppContent />
  )
}
