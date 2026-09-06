import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LandingPage from '../pages/LandingPage';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="page-loading">Loading…</div>;
  if (!user) {
    // "/" is special-cased to show the public landing page instead of
    // bouncing straight to /login - every other protected route still
    // redirects to login as before.
    if (location.pathname === '/') return <LandingPage />;
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
