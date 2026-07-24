import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ToastProvider } from './components/Common/Toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Public Pages
import LandingPage from './pages/LandingPage';
import About from './pages/Public/About';
import Contact from './pages/Public/Contact';
import NotFound from './pages/NotFound';

// Auth Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';

// Dashboard Pages & Layouts
import DashboardLayout from './layouts/DashboardLayout';
import DashboardOverview from './pages/Dashboard/DashboardOverview';
import ResumeUpload from './pages/Dashboard/ResumeUpload';
import ATSReport from './pages/Dashboard/ATSReport';
import ResumeHistory from './pages/Dashboard/ResumeHistory';
import ResumeDetails from './pages/Dashboard/ResumeDetails';
import AIAnalysis from './pages/Dashboard/AIAnalysis';
import ResumeImprovement from './pages/Dashboard/ResumeImprovement';
import JobMatch from './pages/Dashboard/JobMatch';
import Profile from './pages/Dashboard/Profile';
import Settings from './pages/Dashboard/Settings';

/**
 * Route guard to restrict access to authenticated users.
 */
function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

/**
 * Route guard to prevent authenticated users from viewing auth pages (e.g. Login).
 */
function PublicRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return !isAuthenticated ? <Outlet /> : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />

            {/* Auth Public Routes (guards authenticated users away from Login/Register) */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>

            {/* Dashboard Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<DashboardOverview />} />
                <Route path="upload" element={<ResumeUpload />} />
                <Route path="report" element={<ATSReport />} />
                <Route path="ai-analysis" element={<AIAnalysis />} />
                <Route path="improve" element={<ResumeImprovement />} />
                <Route path="improve/:id" element={<ResumeImprovement />} />
                <Route path="job-match" element={<JobMatch />} />
                <Route path="history" element={<ResumeHistory />} />
                <Route path="resume/:id" element={<ResumeDetails />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>

            {/* Wildcard 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}
