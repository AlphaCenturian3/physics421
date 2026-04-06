import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AuthProvider } from './lib/authContext'
import ProtectedRoute from './components/ProtectedRoute'
import NavBar from './components/NavBar'
import AITutorPanel from './components/AITutorPanel'
import { useAppStore } from './store/appStore'

// ─── Lazy pages ───────────────────────────────────────────────────────────────
const Dashboard        = lazy(() => import('./pages/Dashboard'))
const VisualizePage    = lazy(() => import('./pages/VisualizePage'))
const PracticePage     = lazy(() => import('./pages/PracticePage'))
const TutorPage        = lazy(() => import('./pages/TutorPage'))
const LoginPage        = lazy(() => import('./pages/LoginPage'))
const SignupPage       = lazy(() => import('./pages/SignupPage'))

// ─── Auth-aware shell (needs router context) ──────────────────────────────────
const AUTH_PATHS = new Set(['/login', '/signup'])

function AppShell() {
  const isFocusMode = useAppStore(s => s.isFocusMode)
  const location = useLocation()
  const isAuthPage = AUTH_PATHS.has(location.pathname)
  if (import.meta.env.DEV) console.log('[AppShell] render — path:', location.pathname)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary, #0f0f14)' }}>
      <style>{`
        :root {
          --bg-primary:   #0f0f14;
          --bg-surface:   #1a1a24;
          --bg-elevated:  #22223a;
          --accent-blue:  #4f8ef7;
          --accent-amber: #f7a94f;
          --accent-green: #4fde98;
          --text-primary: #e8e8f0;
          --text-secondary: #8888aa;
          --text-muted:   #444466;
          --border:       #2a2a3a;
          font-family: Inter, system-ui, sans-serif;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg-primary); color: var(--text-primary); }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {!isFocusMode && !isAuthPage && <NavBar />}

      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="/visualize/:topicId" element={
              <ProtectedRoute><VisualizePage /></ProtectedRoute>
            } />
            <Route path="/practice" element={
              <ProtectedRoute><PracticePage /></ProtectedRoute>
            } />
            <Route path="/tutor" element={
              <ProtectedRoute><TutorPage /></ProtectedRoute>
            } />

            {/* Public routes */}
            <Route path="/login"  element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Routes>
        </AnimatePresence>
      </Suspense>

      {/* AI Tutor panel — only on protected pages */}
      {!isAuthPage && <AITutorPanel />}
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  )
}

// ─── Page-level loading spinner ───────────────────────────────────────────────
function PageLoader() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
    }}>
      <div style={{
        width: '2rem',
        height: '2rem',
        border: '2px solid rgba(79,142,247,0.25)',
        borderTopColor: 'var(--accent-blue, #4f8ef7)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  )
}
