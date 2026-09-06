import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'];

export default function AdminRoute() {
  const { user, loading } = useAuth();

  if (loading) return <div className="page-loading">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  // Role check happens client-side only for UI routing - every /api/admin/*
  // call is independently re-checked server-side (authorize() in
  // backend/src/middleware/authenticate.js), so this is not a security
  // boundary, just avoids flashing admin UI at a non-admin user.
  if (!ADMIN_ROLES.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}
