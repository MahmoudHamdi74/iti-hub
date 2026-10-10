import { useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useIntlayer } from 'react-intlayer';
import { Card } from '@components/common';
import { useAuthStore } from '@store/auth';
import { useVerifyOtp, useResendOtp } from '@hooks/mutations/useVerifyOtp';

const CODE_LENGTH = 6;

/**
 * Email OTP step of registration (work order item 3).
 *
 * After the register API responds, the user lands here with the email in
 * navigation state (or ?email=). They type the 6-digit code from the email;
 * on success the server returns the app JWT and they're logged in.
 */
export default function EmailOtpController() {
  const t = useIntlayer('authOtp');
  const navigate = useNavigate();
  const location = useLocation();
  const { setToken, setUser } = useAuthStore();

  const email =
    location.state?.email || new URLSearchParams(location.search).get('email') || '';

  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState(location.state?.emailDelivery === 'failed' ? t.deliveryFailed : null);
  const [resendNotice, setResendNotice] = useState(false);

  const verifyMutation = useVerifyOtp();
  const resendMutation = useResendOtp();

  const inputRefs = useRef([]);

  const code = useMemo(() => digits.join(''), [digits]);

  const setDigit = (index, value) => {
    const ch = value.replace(/\D/g, '');
    setDigits((prev) => {
      const next = [...prev];
      // Support paste into any box: distribute across the remaining boxes
      if (ch.length > 1) {
        const paste = ch.slice(0, CODE_LENGTH - index).split('');
        next.splice(index, paste.length, ...paste);
      } else {
        next[index] = ch;
      }
      return next;
    });
    if (ch.length > 1) {
      // Focus the last filled box
      const filled = Math.min(index + ch.length, CODE_LENGTH - 1);
      inputRefs.current[filled]?.focus();
    } else if (ch && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft') inputRefs.current[Math.max(0, index - 1)]?.focus();
    if (e.key === 'ArrowRight') inputRefs.current[Math.min(CODE_LENGTH - 1, index + 1)]?.focus();
  };

  const handleVerify = () => {
    setError(null);
    if (!email) {
      setError(t.networkError);
      return;
    }
    if (code.length < CODE_LENGTH) return;

    verifyMutation.mutate(
      { email, otp: code },
      {
        onSuccess: (response) => {
          const { token, user } = response.data.data;
          setToken(token);
          setUser(user);
          navigate('/');
        },
        onError: (err) => {
          const errorCode = err?.response?.data?.error?.code;
          if (errorCode === 'OTP_EXPIRED') {
            setError(t.expiredCode);
          } else if (errorCode === 'INVALID_OTP' || errorCode === 'VALIDATION_ERROR') {
            setError(t.invalidCode);
          } else {
            setError(t.networkError);
          }
        },
      }
    );
  };

  const handleResend = () => {
    setError(null);
    setResendNotice(false);
    resendMutation.mutate(
      { email },
      {
        onSuccess: () => setResendNotice(true),
        onError: () => setError(t.networkError),
      }
    );
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <div className="space-y-6">
        <h1 className="text-heading-3 text-center text-neutral-900">{t.pageTitle}</h1>

        <p className="text-center text-body-2 text-neutral-600">
          {t.description} <span className="font-semibold text-neutral-900">{email || '—'}</span>
        </p>

        {/* 6-digit code boxes */}
        <div dir="ltr" className="flex justify-center gap-2">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={CODE_LENGTH}
              value={digit}
              onChange={(e) => setDigit(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={(e) => {
                e.preventDefault();
                setDigit(index, e.clipboardData.getData('text'));
              }}
              aria-label={`${t.otpLabel.value} ${index + 1}`}
              className="w-0 min-w-0 flex-1 max-w-11 h-13 text-center text-xl font-semibold text-neutral-900 bg-surface-lowest border border-outline rounded-lg focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-100 transition-colors"
            />
          ))}
        </div>

        {error && (
          <div className="bg-error/10 border-s-4 border-s-error rounded-lg p-3 text-sm text-neutral-900">
            {error}
          </div>
        )}

        {resendNotice && (
          <div className="bg-success/10 border-s-4 border-s-success rounded-lg p-3 text-sm text-neutral-900">
            {t.resendSuccess}
          </div>
        )}

        <button
          type="button"
          onClick={handleVerify}
          disabled={code.length < CODE_LENGTH || verifyMutation.isPending}
          className="w-full h-11 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {verifyMutation.isPending ? t.verifying : t.verifyButton}
        </button>

        <div className="text-center text-sm text-neutral-600">
          {t.resendQuestion}{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendMutation.isPending}
            className="text-secondary-600 hover:text-secondary-700 font-semibold hover:underline disabled:opacity-50"
          >
            {t.resendButton}
          </button>
        </div>

        <div className="text-center text-sm text-neutral-600">
          <Link to="/login" className="text-secondary-600 hover:text-secondary-700 font-semibold hover:underline">
            {t.backToLogin}
          </Link>
        </div>
      </div>
    </Card>
  );
}
