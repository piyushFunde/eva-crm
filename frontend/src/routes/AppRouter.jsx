import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import { ProtectedRoute, PublicRoute } from '@/routes/guards';

// Pages
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import MyList from '@/pages/MyList';
import Admin from '@/pages/Admin';
import NotFound from '@/pages/NotFound';
import AdminRoute from '@/routes/AdminRoute';
import CollectionHistory from '@/pages/CollectionHistory';
import Analytics from '@/pages/Analytics';
import SyncQueue from '@/pages/SyncQueue';

export default function AppRouter() {
  return (
    <Routes>
      {/* Root path is now the Login page */}
      <Route
        path="/"
        element={
          <Login />
        }
      />

      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Protected routes with layout shell */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/my-list" element={<MyList />} />
        <Route path="/collection-history" element={<CollectionHistory />} />
        
        {/* Admin only routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<Admin />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/sync-queue" element={<SyncQueue />} />
        </Route>
      </Route>

      {/* 404 catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
