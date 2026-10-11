import { useEffect, useRef, useState } from 'react';

// Stable observer: changing render callbacks must not retrigger an already visible
// sentinel. A callback ref also handles targets mounted after an initial loader.
export const useIntersectionObserver = ({ onIntersect, enabled = true, threshold = 0.1, root = null }) => {
  const [target, observerTarget] = useState(null);
  const latest = useRef(onIntersect);
  const visible = useRef(false);
  latest.current = onIntersect;
  useEffect(() => {
    if (!enabled || !target || typeof IntersectionObserver === 'undefined') return;
    let pending = false;
    const observer = new IntersectionObserver(entries => {
      if (!entries[0]?.isIntersecting) { visible.current = false; return; }
      if (visible.current || pending) return;
      visible.current = true;
      pending = true;
      Promise.resolve(latest.current?.()).finally(() => { pending = false; }).catch(() => {});
    }, { threshold, root });
    observer.observe(target);
    return () => observer.disconnect();
  }, [enabled, target, threshold, root]);
  return { observerTarget };
};
export default useIntersectionObserver;
