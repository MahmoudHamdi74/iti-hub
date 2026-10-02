import { useEffect, useState } from 'react';

const sizeClasses = {
  sm: 'w-6 h-6',   // 24px
  md: 'w-10 h-10', // 40px
  lg: 'w-14 h-14', // 56px
};

const borderClasses = {
  sm: 'border-2',
  md: 'border-[3px]',
  lg: 'border-4',
};

/**
 * Dual-ring spinner: a faint full track, a rotating primary arc, and a
 * pulsing core dot. Replaces the bare rotating outline icon which looked
 * unbalanced (thin, off-center, no visual anchor).
 */
function SpinnerVariant({ size = 'md', className = '' }) {
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className={`relative inline-flex ${sizeClasses[size]}`}>
        {/* Faint track */}
        <span
          className={`absolute inset-0 rounded-full border-primary-600/15 ${borderClasses[size]}`}
          aria-hidden="true"
        />
        {/* Rotating arc */}
        <span
          className={`absolute inset-0 rounded-full border-transparent border-t-primary-600 border-e-primary-600/40 animate-spin ${borderClasses[size]} [animation-duration:0.9s]`}
          aria-hidden="true"
        />
        {/* Pulsing core */}
        <span
          className="m-auto h-[24%] w-[24%] rounded-full bg-primary-600 animate-pulse"
          aria-hidden="true"
        />
        <span className="sr-only">Loading…</span>
      </span>
    </div>
  );
}

function SkeletonVariant({ className = '' }) {
  return (
    <div className={`space-y-3 ${className}`} role="status" aria-hidden="true">
      <div className="h-4 bg-neutral-200 rounded animate-pulse"></div>
      <div className="h-4 bg-neutral-200 rounded animate-pulse w-5/6"></div>
      <div className="h-4 bg-neutral-200 rounded animate-pulse w-4/6"></div>
    </div>
  );
}

/**
 * Fade-in wrapper so spinners that mount/unmount quickly don't flash.
 */
export default function Loading({ variant = 'spinner', size = 'md', className = '' }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const fade = `transition-opacity duration-200 ${mounted ? 'opacity-100' : 'opacity-0'}`;

  if (variant === 'skeleton') {
    return <SkeletonVariant className={`${className} ${fade}`} />;
  }

  return <SpinnerVariant size={size} className={`${className} ${fade}`} />;
}
