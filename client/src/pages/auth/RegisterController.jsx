import { useIntlayer } from "react-intlayer";
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, ErrorDisplay } from "@components/common";
import { useAuthStore } from "@store/auth";
import { useRegister } from "@hooks/mutations/useRegister";
import { useGoogleAuth } from "@hooks/mutations/useGoogleAuth";
import { useCheckEmailAvailability } from "@hooks/mutations/useCheckEmailAvailability";
import { useCheckUsernameAvailability } from "@hooks/mutations/useCheckUsernameAvailability";
import {
  generateUsernameSuggestions,
  validateUsername,
  isPasswordValid,
} from "@/utils/registerHelpers";
import RegisterStepOne from "@components/auth/RegisterStepOne";
import RegisterStepTwo from "@components/auth/RegisterStepTwo";
import RegisterStepThree from "@components/auth/RegisterStepThree";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

dayjs.extend(duration);

const COOLDOWN_KEY = "register-cooldown";
const COOLDOWN_DURATION = 15 * 60 * 1000; // 15 minutes

export default function RegisterController() {
  const t = useIntlayer('authRegister');
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();
  const debounceRef = useRef(null);
  const usernameRequestRef = useRef(0);
  useEffect(() => () => {
    clearTimeout(debounceRef.current);
    usernameRequestRef.current += 1;
  }, []);


  // Multi-step state
  const [currentStep, setCurrentStep] = useState(1);

  // Form data
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
  });

  // Validation & UI state
  const [errors, setErrors] = useState({});
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameSuggestions, setUsernameSuggestions] = useState([]);
  const [cooldown, setCooldown] = useState(null);

  // Mutations
  const checkEmailMutation = useCheckEmailAvailability();
  const checkUsernameMutation = useCheckUsernameAvailability();
  const registerMutation = useRegister();
  const googleAuthMutation = useGoogleAuth();

  // Check cooldown on mount
  useEffect(() => {
    const storedCooldown = localStorage.getItem(COOLDOWN_KEY);
    if (storedCooldown) {
      const cooldownEnd = parseInt(storedCooldown, 10);
      if (Date.now() < cooldownEnd) {
        setCooldown(cooldownEnd);
      } else {
        localStorage.removeItem(COOLDOWN_KEY);
      }
    }
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (!cooldown) return;

    const interval = setInterval(() => {
      const remaining = cooldown - Date.now();
      if (remaining <= 0) {
        setCooldown(null);
        localStorage.removeItem(COOLDOWN_KEY);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldown]);

  // Check username availability with debounce
  const checkUsernameDebounced = useCallback(
  (username) => {
    const requestId = ++usernameRequestRef.current;
    clearTimeout(debounceRef.current);
    setUsernameAvailable(null);
    setIsCheckingUsername(false);

    if (!username || username.length < 3) return;

    const validation = validateUsername(username);

    if (!validation.valid) {
      if (!validation.validFormat) {
        setErrors((prev) => ({
          ...prev,
          username: t.errorUsernameInvalid,
        }));
      } else if (!validation.validLength) {
        setErrors((prev) => ({
          ...prev,
          username: t.errorUsernameLength,
        }));
      }

      setUsernameAvailable(null);
      debounceRef.current = null;
      return;
    }

    setErrors((prev) => ({ ...prev, username: null }));
    setIsCheckingUsername(true);

    debounceRef.current = setTimeout(() => {
      checkUsernameMutation.mutate(
        { username },
        {
          onSuccess: (response) => {
            if (requestId !== usernameRequestRef.current) return;
            setUsernameAvailable(response.data?.data?.available ?? null);
            setIsCheckingUsername(false);
            debounceRef.current = null;
          },
          onError: () => {
            if (requestId !== usernameRequestRef.current) return;
            setUsernameAvailable(null);
            setIsCheckingUsername(false);
            debounceRef.current = null;
          },
        }
      );
    }, 1000);
  },
  [checkUsernameMutation, t]
);


  // Update form data
  const handleChange = (updates) => {
    if (updates.username !== undefined) checkUsernameDebounced(updates.username);
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  // Step 1: Check email availability
  const handleStepOneNext = () => {
    if (!formData.email) {
      setErrors({ email: t.errorEmailInvalid });
      return;
    }

    checkEmailMutation.mutate(
      { email: formData.email },
      {
        onSuccess: (response) => {
          const available = response.data?.data?.available;
          if (response.data?.data?.requiresVerification) {
            navigate('/verify-otp', { state: { email: formData.email.trim().toLowerCase() } });
            return;
          }
          if (available) {
            // Generate username suggestions
            const suggestions = generateUsernameSuggestions(formData.email);
            setUsernameSuggestions(suggestions);
            setErrors({});
            setCurrentStep(2);
          } else {
            setErrors({ email: t.errorEmailTaken });
          }
        },
        onError: () => {
          setErrors({ email: t.errorNetwork });
        },
      }
    );
  };

  // Step 2: Proceed to profile
  const handleStepTwoNext = () => {
    if (!validateUsername(formData.username).valid || usernameAvailable === false) {
      setErrors({ username: usernameAvailable === false ? t.errorUsernameTaken : t.errorUsernameInvalid });
      return;
    }

    setErrors({});
    setCurrentStep(3);
  };

  // Select username suggestion
  const handleSelectSuggestion = (username) => {
    handleChange({ username });
  };

  // Final submission
  const handleSubmit = () => {
    // Validate passwords
    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: t.errorPasswordMatch });
      return;
    }

    if (!isPasswordValid(formData.password)) {
      setErrors({ password: t.errorPasswordPolicy });
      return;
    }

    // Clear errors
    setErrors({});

    // Submit registration
    registerMutation.mutate(
      {
        email: formData.email,
        username: formData.username,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password,
      },
      {
        onSuccess: (response) => {
          // The server no longer returns a token at registration — the user
          // must verify the 6-digit OTP emailed to them first (work order 3).
          const email = response.data.data?.email || formData.email;
          navigate("/verify-otp", { state: { email } });
        },
        onError: (error) => {
          const errorCode = error.response?.data?.error?.code;

          if (errorCode === 'EMAIL_VERIFICATION_REQUIRED') {
            navigate('/verify-otp', { state: { email: formData.email.trim().toLowerCase() } });
          } else if (errorCode === "TOO_MANY_REQUESTS") {
            const cooldownEnd = Date.now() + COOLDOWN_DURATION;
            localStorage.setItem(COOLDOWN_KEY, cooldownEnd.toString());
            setCooldown(cooldownEnd);
          } else if (errorCode === "EMAIL_EXISTS" || errorCode === "EMAIL_TAKEN") {
            setErrors({ email: t.errorEmailTaken });
            setCurrentStep(1);
          } else if (errorCode === "USERNAME_EXISTS" || errorCode === "USERNAME_TAKEN") {
            setErrors({ username: t.errorUsernameTaken });
            setCurrentStep(2);
          }
        },
      }
    );
  };

  // Google Sign-In completes registration instantly (server creates the
  // account from the verified Google profile and returns the app JWT)
  const handleGoogleSuccess = (idToken) => {
    googleAuthMutation.mutate(
      { idToken },
      {
        onSuccess: (response) => {
          const { token, user } = response.data.data;
          setToken(token);
          setUser(user);
          navigate("/");
        },
      }
    );
  };

  // Cooldown message
  if (cooldown) {
    const remaining = Math.ceil((cooldown - Date.now()) / 1000);
    const remainingDuration = dayjs.duration(remaining, "seconds");
    const timeString = remainingDuration.format("mm:ss");

    return (
      <Card className="w-full max-w-md mx-auto">
        <div className="space-y-6">
          <h1 className="text-heading-3 text-center text-neutral-900">
            {t.pageTitle}
          </h1>
          <ErrorDisplay
            error={{
              message: t.cooldownMessage.replace("{time}", timeString),
            }}
          />
          <div className="text-center text-sm text-neutral-600">
            {t.haveAccount}{" "}
            <Link
              to="/login"
              className="text-secondary-600 hover:text-secondary-700 font-semibold hover:underline"
            >
              {t.loginLink}
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <div className="space-y-6">
        <h1 className="text-heading-3 text-center text-neutral-900">
          {t.pageTitle}
        </h1>

        {/* Step Indicator */}
        <div className="flex justify-center gap-2">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`h-2 w-16 rounded-full transition-colors ${
                step <= currentStep ? "bg-primary-600" : "bg-neutral-200"
              }`}
            />
          ))}
        </div>

        {/* Error Display */}
        {(registerMutation.isError || googleAuthMutation.isError) && (
          <ErrorDisplay
            error={registerMutation.isError ? registerMutation.error : googleAuthMutation.error}
          />
        )}

        {/* Step Components */}
        {currentStep === 1 && (
          <RegisterStepOne
            email={formData.email}
            errors={errors}
            onChange={handleChange}
            onNext={handleStepOneNext}
            checking={checkEmailMutation.isPending}
            onGoogleSuccess={handleGoogleSuccess}
          />
        )}

        {currentStep === 2 && (
          <RegisterStepTwo
            username={formData.username}
            errors={errors}
            onChange={handleChange}
            onNext={handleStepTwoNext}
            onBack={() => setCurrentStep(1)}
            available={usernameAvailable}
            checking={isCheckingUsername}
            suggestions={usernameSuggestions}
            onSelectSuggestion={handleSelectSuggestion}
          />
        )}

        {currentStep === 3 && (
          <RegisterStepThree
            firstName={formData.firstName}
            lastName={formData.lastName}
            password={formData.password}
            confirmPassword={formData.confirmPassword}
            errors={errors}
            onChange={handleChange}
            onSubmit={handleSubmit}
            onBack={() => setCurrentStep(2)}
            submitting={registerMutation.isPending}
          />
        )}

        {/* Login Link */}
        <div className="text-center text-sm text-neutral-600">
          {t.haveAccount}{" "}
          <Link
            to="/login"
            className="text-secondary-600 hover:text-secondary-700 font-semibold hover:underline"
          >
            {t.loginLink}
          </Link>
        </div>
      </div>
    </Card>
  );
}
