import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { PageSkeleton } from './Skeletons.jsx';

/**
 * Guards routes in the UI. This is a convenience only: every API route is ALSO protected on the server.
 * <ProtectedRoute />                 -> any signed-in user
 * <ProtectedRoute adminOnly />       -> administrators only
 * <ProtectedRoute allowedRoles={['admin', 'staff']} /> -> specific roles
 */
export default function ProtectedRoute({ adminOnly = false, allowedRoles = null }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageSkeleton />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}
