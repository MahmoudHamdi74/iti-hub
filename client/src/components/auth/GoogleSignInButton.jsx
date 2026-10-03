import { useEffect, useRef, useState } from "react";
import { useIntlayer } from "react-intlayer";
import { registerGoogleIdentity } from '@/lib/googleIdentity';

// Single global promise for the GIS script — shared across button mounts
let gisScriptPromise = null;

/** Lazily inject Google Identity Services and resolve with window.google. */
function loadGoogleScript() {
  if (typeof window === "undefined") return Promise.resolve(null);

  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google);
  }

  if (!gisScriptPromise) {
    gisScriptPromise = new Promise((resolve) => {
      const existing = document.getElementById("google-gis-script");
      if (existing) {
        existing.addEventListener("load", () => resolve(window.google), { once: true });
        existing.addEventListener("error", () => { gisScriptPromise = null; existing.remove(); resolve(null); }, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.id = "google-gis-script";
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(window.google);
      script.onerror = () => { gisScriptPromise = null; script.remove(); resolve(null); };
      document.head.appendChild(script);
    });
  }

  return gisScriptPromise;
}

/**
 * Google Sign-In button (Google Identity Services).
 *
 * Renders the official Google button once the GIS script loads and the
 * client ID is configured. The credential (ID token) is handed to the
 * parent via `onSuccess(credential)` — the parent then calls POST /auth/google.
 *
 * Renders nothing when Google Sign-In is not configured (missing env var).
 */
export default function GoogleSignInButton({ onSuccess, onError, disabled = false }) {
  const t = useIntlayer('authGoogle');
  const buttonRef = useRef(null);
  const subscriptionRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [failed, setFailed] = useState(false);

  // Keep the latest callbacks in refs so the GIS callback never goes stale
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) {
      setConfigured(false);
      return;
    }

    let cancelled = false;

    loadGoogleScript().then((google) => {
      if (cancelled) return;
      if (!google?.accounts?.id) { setFailed(true); return; }

      subscriptionRef.current = registerGoogleIdentity(google.accounts.id, clientId, {
        success: credential => onSuccessRef.current?.(credential),
        error: error => onErrorRef.current?.(error),
      });

      setReady(true);
    });

    return () => {
      cancelled = true;
      subscriptionRef.current?.release();
      subscriptionRef.current = null;
    };
  }, [clientId]);

  // Render the official button once GIS is ready
  useEffect(() => {
    if (!ready || !buttonRef.current) return;
    const host = buttonRef.current;
    let renderedWidth = 0;
    const render = () => {
      const width = Math.floor(host.getBoundingClientRect().width);
      if (!width || width === renderedWidth) return;
      renderedWidth = width;
      host.replaceChildren();
      window.google.accounts.id.renderButton(host, {
      click_listener: () => subscriptionRef.current?.activate(),
      type: "standard",
      theme: "outline",
      size: "large",
      shape: "rectangular",
      text: "continue_with",
      logo_alignment: "left",
      width,
      });
    };
    render();
    const observer = new ResizeObserver(render);
    observer.observe(host);
    return () => observer.disconnect();
  }, [ready]);

  if (!configured) {
    return null;
  }

  return (
    <div className="space-y-2">
    <div
      className={`flex justify-center transition-opacity ${
        disabled ? "opacity-50 pointer-events-none" : ""
      }`}
      role="button"
      aria-label={t.buttonLabel.value}
    >
      {!ready && !failed && (
        <div className="h-10 w-full max-w-[320px] animate-pulse rounded-full bg-neutral-200" />
      )}
      <div
        ref={buttonRef}
        className="w-full min-w-0 max-w-[320px]"
        style={{ visibility: ready ? "visible" : "hidden" }}
        data-testid="google-sign-in-button"
      />
    </div>
    <p className="text-center text-xs text-neutral-500" role={failed ? 'status' : undefined}>
      {failed ? t.errorUnavailable : t.popupHelp}
    </p>
    </div>
  );
}
