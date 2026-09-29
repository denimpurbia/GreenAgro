import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AppContext';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isAuthLoading } = useAuth();
  const location = useLocation();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#071d12] text-white">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
        <p className="text-sm text-gray-300 font-medium">Verifying farm session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect unauthenticated users to /login preserving target location
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};
