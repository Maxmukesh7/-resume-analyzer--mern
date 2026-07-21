import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/Common/Toast';

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
import Profile from './pages/Dashboard/Profile';
import Settings from './pages/Dashboard/Settings';

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Dashboard Nested Routes */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="upload" element={<ResumeUpload />} />
            <Route path="report" element={<ATSReport />} />
            <Route path="history" element={<ResumeHistory />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Wildcard 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

