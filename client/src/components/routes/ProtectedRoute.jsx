import { Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useLoginModalStore } from '@hooks/useRequireAuth';
import { useAuthStore } from '@store/auth';

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuthStore();
  const openModal = useLoginModalStore(state => state.openModal);
  useEffect(() => {
    if (!isAuthenticated) openModal();
  }, [isAuthenticated, openModal]);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
