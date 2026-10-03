import BrandLogo from '@components/common/BrandLogo';
import { useEffect, useState } from 'react';
import { useIntlayer } from 'react-intlayer';
import { useAuthStore } from '@store/auth';
import api from '@/lib/api';
import { disconnectSocket } from '@/lib/socket';

export default function AuthProvider({ children }) {
  const content = useIntlayer('authProvider');
  const [isVerifying, setIsVerifying] = useState(true);

  const {
    token,
    hasHydrated,
    authError,
    setUser,
    clearAuthError,
    logout,
  } = useAuthStore();
  useEffect(() => {
    if (!token) disconnectSocket();
  }, [token]);

  // Initial token verification (startup only)
  useEffect(() => {
    if (!hasHydrated) { 
        return; }

    const verifyToken = async () => {
      if (!token) {
        setIsVerifying(false);
        return;
      }

      try {
        const response = await api.get('/users/me');
        setUser(response.data);
        setIsVerifying(false);
      } catch {
        logout();
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [hasHydrated]);

  // Handle auth failures AFTER startup
  useEffect(() => {
    if (!hasHydrated) return;
    if (!authError) return;

    console.log('[AuthProvider] Authentication error detected, logging out.');
    logout();
    clearAuthError();
  }, [authError, hasHydrated]);

  // Splash screen during verification
  if (isVerifying) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-neutral-50 z-50">
        <div className="text-center">
          <div className="mb-4">
            <div className="w-18 h-18 mx-auto bg-primary-600 rounded-full flex items-center justify-center animate-pulse">
              <BrandLogo className="h-16 w-16" />
            </div>
          </div>

          <p className="text-body-1 text-neutral-600">
            {content.verifyingSession}
          </p>

          <div className="mt-4">
            <div className="inline-block w-6 h-6 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return children;
}
