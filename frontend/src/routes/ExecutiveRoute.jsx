import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '@/store/authStore';

export default function ExecutiveRoute() {
  const { isAuthenticated, isExecutive } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isExecutive()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
