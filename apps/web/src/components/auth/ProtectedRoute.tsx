import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AppContext';
import { authService } from '../../services/authService';
import { UserRole } from '../../types';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isAuthLoading, user } = useAuth();
  const location = useLocation();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#071d12] text-white">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
        <p className="text-sm text-gray-300 font-medium">Verifying portal session...</p>
      </div>
    );
  }

  if (!isAuthenticated || (user?.accountStatus && user.accountStatus !== 'verified')) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export const RoleProtectedRoute: React.FC<{
  allowedRoles: UserRole[];
  children?: React.ReactNode;
}> = ({ allowedRoles, children }) => {
  const { isAuthenticated, isAuthLoading, user } = useAuth();
  const location = useLocation();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#071d12] text-white">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
        <p className="text-sm text-gray-300 font-medium">Verifying role authorization...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user || (user.accountStatus && user.accountStatus !== 'verified')) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const effectiveRole: UserRole = authService.isGovtOrg(user) ? 'govt_org' : 'farmer';
  if (!allowedRoles.includes(effectiveRole)) {
    const fallbackPortal = effectiveRole === 'govt_org' ? '/app/gov' : '/app';
    return <Navigate to={fallbackPortal} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
