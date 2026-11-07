import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { useLiteMode } from '@/hooks/useLiteMode';
import { ToastContainer } from '@/components/ui/Toast';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { Skeleton } from '@/components/ui/Skeleton';

// Lazy-loaded pages
const SuperDashboard = lazy(() => import('@/pages/super/SuperDashboard'));
const CafesListPage = lazy(() => import('@/pages/super/CafesListPage'));
const CafeDetailPage = lazy(() => import('@/pages/super/CafeDetailPage'));
const AdminsListPage = lazy(() => import('@/pages/super/AdminsListPage'));
const AuditLogPage = lazy(() => import('@/pages/super/AuditLogPage'));
const PlatformSettingsPage = lazy(() => import('@/pages/super/PlatformSettingsPage'));

const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const MenuManagementPage = lazy(() => import('@/pages/admin/MenuManagementPage'));
const ReportsPage = lazy(() => import('@/pages/admin/ReportsPage'));
const InventoryPage = lazy(() => import('@/pages/admin/InventoryPage'));
const MenuPage = lazy(() => import('@/pages/customer/MenuPage'));
const CustomerCartPage = lazy(() => import('@/pages/customer/CustomerCartPage'));
const OrderStatusPage = lazy(() => import('@/pages/customer/OrderStatusPage'));

const PageLoader = () => (
  <div className="p-8 space-y-4 max-w-4xl mx-auto">
    <Skeleton className="h-10 w-48" />
    <Skeleton className="h-40 w-full" />
    <Skeleton className="h-64 w-full" />
  </div>
);

export const App: React.FC = () => {
  useTheme();
  useLiteMode();

  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Root & Auth */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Customer QR Landing & Ordering (Mobile first) */}
            <Route path="/m/:cafeId/:token" element={<CustomerLayout />}>
              <Route index element={<MenuPage />} />
              <Route path="cart" element={<CustomerCartPage />} />
              <Route path="order/:orderId" element={<OrderStatusPage />} />
            </Route>

            {/* Super Admin Area */}
            <Route
              path="/super"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['superadmin']}>
                    <AdminLayout />
                  </RoleGuard>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/super/dashboard" replace />} />
              <Route path="dashboard" element={<SuperDashboard />} />
              <Route path="cafes" element={<CafesListPage />} />
              <Route path="cafes/:id" element={<CafeDetailPage />} />
              <Route path="admins" element={<AdminsListPage />} />
              <Route path="audit" element={<AuditLogPage />} />
              <Route path="settings" element={<PlatformSettingsPage />} />
            </Route>

            {/* Admin Area (Cafe Owner / Manager) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRoles={['admin', 'superadmin']}>
                    <AdminLayout />
                  </RoleGuard>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/orders" replace />} />
              <Route path="orders" element={<AdminDashboard />} />
              <Route path="floor-map" element={<AdminDashboard />} />
              <Route path="menu" element={<MenuManagementPage />} />
              <Route path="payments" element={<AdminDashboard />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<AdminDashboard />} />
            </Route>

            {/* Catch-all 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
        <ToastContainer />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
