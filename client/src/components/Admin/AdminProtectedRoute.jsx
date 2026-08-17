import React from 'react';
import { Navigate, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiShieldOff, FiLock, FiHome } from 'react-icons/fi';

/**
 * Guard route component ensuring only users with role === 'admin' can access admin views.
 */
export default function AdminProtectedRoute() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-slate-400 text-sm font-medium">Verifying administrator credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-400">
            <FiShieldOff className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">403 - Access Forbidden</h1>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            You do not have administrator permissions to access this dashboard. This section is restricted strictly to authorized admin accounts.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition-all"
            >
              <FiHome className="w-4 h-4" />
              User Dashboard
            </Link>
            <Link
              to="/admin/login"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/30"
            >
              <FiLock className="w-4 h-4" />
              Admin Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
