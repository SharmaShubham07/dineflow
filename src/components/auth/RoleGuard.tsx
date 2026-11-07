import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';

export const RoleGuard: React.FC<{
  allowedRoles: UserRole[];
  children: React.ReactNode;
}> = ({ allowedRoles, children }) => {
  const { userProfile, loading } = useAuth();

  if (loading) return null;

  if (!userProfile || !allowedRoles.includes(userProfile.role)) {
    // If Super Admin accesses admin, allow impersonation/management
    if (userProfile?.role === 'superadmin') {
      return <>{children}</>;
    }
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

