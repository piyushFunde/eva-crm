import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '@/store/authStore';

export default function AdminRoute() {
  const { isAuthenticated, isAdmin } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
