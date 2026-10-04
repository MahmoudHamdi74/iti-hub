import { HiOutlineExclamationCircle } from "react-icons/hi2";
import Button from "./Button";

export default function ErrorDisplay({ error, message, onRetry, className = "" }) {
  const apiError = error?.response?.data?.error;
  error = apiError || error || (message ? { message } : null);
  if (!error) return null;

  return (
    <div
      className={`
        bg-error/10
        border-s-4 border-s-error
        rounded-lg
        p-4
        ${className}
      `}
      role="alert"
    >
      <div className="flex">
        <div className="shrink-0">
          <HiOutlineExclamationCircle
            className="h-5 w-5 text-error"
            aria-hidden="true"
          />
        </div>
        <div className="ms-3 flex-1">
          {/* Error Message */}
          <p className="text-sm font-medium text-neutral-900">
            {error.message}
          </p>

          {/* Error Code */}
          {error.code && (
            <p className="mt-1 text-xs text-neutral-600">Code: {error.code}</p>
          )}

          {/* Field-specific Errors */}
          {(error.fields || error.details?.fields) && (
            <ul className="mt-2 space-y-1">
              {Object.entries(error.fields || error.details.fields).map(([field, message]) => (
                <li key={field} className="text-sm text-neutral-700">
                  • {message}
                </li>
              ))}
            </ul>
          )}

          {/* Retry Button */}
          {onRetry && (
            <div className="mt-3">
              <Button
                variant="text"
                onClick={onRetry}
                className="text-error hover:text-error hover:bg-error/20"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
