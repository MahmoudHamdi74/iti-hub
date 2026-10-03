import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import dayjs from 'dayjs';
import { useAuthStore } from '@store/auth';
import { useLogin } from '@hooks/mutations/useLogin';
import { useGoogleAuth } from '@hooks/mutations/useGoogleAuth';
import AuthLoginForm from '@components/auth/AuthLoginForm';
import { ErrorDisplay } from '@components/common';

const COOLDOWN_KEY = 'login-cooldown';
const DEFAULT_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes

export default function AuthLoginController() {
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();
  const [cooldownEnd, setCooldownEnd] = useState(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const loginMutation = useLogin();
  const googleAuthMutation = useGoogleAuth();

  // Watch form values
  const email = watch('email');
  const password = watch('password');

  // Check for existing cooldown on mount
  useEffect(() => {
    const storedCooldown = localStorage.getItem(COOLDOWN_KEY);
    if (storedCooldown) {
      const cooldownTime = parseInt(storedCooldown, 10);
      const now = Date.now();
      
      if (cooldownTime > now) {
        setCooldownEnd(cooldownTime);
        setCooldownRemaining(cooldownTime - now);
      } else {
        localStorage.removeItem(COOLDOWN_KEY);
      }
    }
  }, []);

  // Update cooldown timer
  useEffect(() => {
    if (!cooldownEnd) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = cooldownEnd - now;

      if (remaining <= 0) {
        setCooldownEnd(null);
        setCooldownRemaining(0);
        localStorage.removeItem(COOLDOWN_KEY);
      } else {
        setCooldownRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownEnd]);

  const handleFormChange = (updates) => {
    Object.keys(updates).forEach((key) => {
      setValue(key, updates[key]);
    });
  };

  const onSubmit = handleSubmit((data) => {
    if (cooldownEnd) return;

    loginMutation.mutate(data, {
      onSuccess: (response) => {
        const { token, user } = response.data.data;
        setToken(token);
        setUser(user);
        navigate('/');
      },
      onError: (error) => {
        const errorCode = error?.response?.data?.error?.code;
        if (errorCode === 'EMAIL_NOT_VERIFIED') {
          navigate(`/verify-otp?email=${encodeURIComponent(data.email.trim())}`);
          return;
        }
        
        if (errorCode === 'TOO_MANY_REQUESTS') {
          const retryAfter = error?.response?.data?.error?.retryAfter || DEFAULT_COOLDOWN_MS;
          const cooldownTime = Date.now() + retryAfter;
          localStorage.setItem(COOLDOWN_KEY, cooldownTime.toString());
          setCooldownEnd(cooldownTime);
          setCooldownRemaining(retryAfter);
        }
      },
    });
  });

  const inCooldown = cooldownEnd && cooldownRemaining > 0;

  // Google Sign-In — exchange the GIS credential (ID token) for the app JWT
  const handleGoogleSuccess = (idToken) => {
    googleAuthMutation.mutate(
      { idToken },
      {
        onSuccess: (response) => {
          const { token, user } = response.data.data;
          setToken(token);
          setUser(user);
          navigate('/');
        },
        // Errors flow through googleAuthMutation.error → ErrorDisplay below
      }
    );
  };
  const formErrors = {
    email: errors.email?.message,
    password: errors.password?.message,
  };

  // Map server errors to form fields (either the password login or the Google login)
  const rawServerError =
    loginMutation.error?.response?.data?.error ||
    googleAuthMutation.error?.response?.data?.error;
  const serverError = rawServerError ?? null;
  if (serverError && serverError.code === 'INVALID_CREDENTIALS') {
    formErrors.email = formErrors.email || 'Invalid email or password';
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Error Display */}
      {(loginMutation.isError || googleAuthMutation.isError) && serverError?.code !== 'INVALID_CREDENTIALS' && (
        <ErrorDisplay
          error={serverError}
          onRetry={!inCooldown ? () => { loginMutation.reset(); googleAuthMutation.reset(); } : undefined}
        />
      )}

      {/* Cooldown Message */}
      {inCooldown && (
        <div className="bg-error/10 border-s-4 border-s-error rounded-lg p-4">
          <p className="text-sm text-neutral-900">
            Too many login attempts. Please wait{' '}
            {dayjs.duration(cooldownRemaining).format('mm:ss')} before trying again.
          </p>
        </div>
      )}

      {/* Login Form */}
      <AuthLoginForm
        email={email}
        password={password}
        errors={formErrors}
        submitting={loginMutation.isPending || googleAuthMutation.isPending}
        disabled={inCooldown}
        onChange={handleFormChange}
        onSubmit={onSubmit}
        onGoogleSuccess={handleGoogleSuccess}
        onGoogleError={() => {
          // GIS itself failed (no credential) — nothing to send to the server.
          // The button remains rendered so the user can simply retry.
          googleAuthMutation.reset();
        }}
      />
    </div>
  );
}
