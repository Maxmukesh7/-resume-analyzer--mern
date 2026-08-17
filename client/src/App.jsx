import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ToastProvider } from './components/Common/Toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Public Pages (Eagerly loaded for instant landing experience)
import LandingPage from './pages/LandingPage';
import About from './pages/Public/About';
import Contact from './pages/Public/Contact';
import NotFound from './pages/NotFound';

// Auth Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import AdminLayout from './layouts/AdminLayout';
import AdminProtectedRoute from './components/Admin/AdminProtectedRoute';
import AdminLogin from './pages/Admin/AdminLogin';

// Dashboard Pages (Lazy Loaded for optimized initial bundle)
const DashboardOverview = lazy(() => import('./pages/Dashboard/DashboardOverview'));
const ResumeUpload = lazy(() => import('./pages/Dashboard/ResumeUpload'));
const ATSReport = lazy(() => import('./pages/Dashboard/ATSReport'));
const ResumeHistory = lazy(() => import('./pages/Dashboard/ResumeHistory'));
const ResumeDetails = lazy(() => import('./pages/Dashboard/ResumeDetails'));
const AIAnalysis = lazy(() => import('./pages/Dashboard/AIAnalysis'));
const ResumeImprovement = lazy(() => import('./pages/Dashboard/ResumeImprovement'));
const JobMatch = lazy(() => import('./pages/Dashboard/JobMatch'));
const CandidateRanking = lazy(() => import('./pages/Dashboard/CandidateRanking'));
const Profile = lazy(() => import('./pages/Dashboard/Profile'));
const Settings = lazy(() => import('./pages/Dashboard/Settings'));

// Admin Pages (Lazy Loaded)
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/Admin/AdminUsers'));
const AdminResumes = lazy(() => import('./pages/Admin/AdminResumes'));
const AdminAnalytics = lazy(() => import('./pages/Admin/AdminAnalytics'));
const AdminActivity = lazy(() => import('./pages/Admin/AdminActivity'));
const AdminSettings = lazy(() => import('./pages/Admin/AdminSettings'));

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
          <Suspense
            fallback={
              <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mb-3"></div>
                <p className="text-slate-400 text-xs font-medium">Loading AI Resume Analyzer...</p>
              </div>
            }
          >
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

              {/* Admin Login Route */}
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* User Dashboard Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<DashboardOverview />} />
                  <Route path="upload" element={<ResumeUpload />} />
                  <Route path="report" element={<ATSReport />} />
                  <Route path="ai-analysis" element={<AIAnalysis />} />
                  <Route path="improve" element={<ResumeImprovement />} />
                  <Route path="improve/:id" element={<ResumeImprovement />} />
                  <Route path="job-match" element={<JobMatch />} />
                  <Route path="rankings" element={<CandidateRanking />} />
                  <Route path="history" element={<ResumeHistory />} />
                  <Route path="resume/:id" element={<ResumeDetails />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Route>

              {/* Admin Dashboard Protected Routes */}
              <Route element={<AdminProtectedRoute />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="resumes" element={<AdminResumes />} />
                  <Route path="rankings" element={<CandidateRanking />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="activity" element={<AdminActivity />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>
              </Route>

              {/* Wildcard 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}
