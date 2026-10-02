import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { HiXMark } from 'react-icons/hi2';

/**
 * Lightbox — click ANY image or video anywhere in the app and it opens in a
 * fullscreen overlay (work order item 6).
 *
 * Implementation: one global document-level click listener (capture phase)
 * resolves clicks on `img`/`video` elements, so every screen gets the
 * behavior without wrapping individual components.
 *
 * Clicks are ignored when the media:
 *  - sits inside a link, button, or [role="button"] (navigation/action first)
 *  - is explicitly opted out via data-no-lightbox (element or ancestor)
 *  - is a native-controls video (user is driving the player itself)
 *  - is a tiny intrinsic image (<64px — icons/spacers)
 *
 * Close with ✕, Escape, or a click on the dark backdrop.
 */

const LIGHTBOX_STYLES = `
@keyframes lb-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes lb-zoom-in { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
.lb-overlay { animation: lb-fade-in 0.15s ease-out both; }
.lb-media { animation: lb-zoom-in 0.18s ease-out both; }
`;

function isExcluded(el) {
  return !!(
    el.closest('a, button, [role="button"], [data-no-lightbox]') ||
    el.dataset?.noLightbox != null
  );
}

export default function Lightbox() {
  const [media, setMedia] = useState(null); // { type: 'image'|'video', src, alt }

  // Global click delegation — capture so it runs before app handlers.
  useEffect(() => {
    const handleClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;

      const el = e.target.closest?.('img, video');
      if (!el || isExcluded(el)) return;
      if (el.closest('.lb-overlay')) return;

      if (el.tagName === 'VIDEO') {
        if (el.controls) return; // let the user drive the native player
        const src =
          el.currentSrc ||
          el.querySelector('source')?.src ||
          el.src;
        if (!src) return;
        setMedia({ type: 'video', src, alt: el.getAttribute('aria-label') || '' });
        e.preventDefault();
        return;
      }

      // <img>
      if (el.naturalWidth && el.naturalHeight && el.naturalWidth < 64 && el.naturalHeight < 64) {
        return; // icon-sized artwork, not content
      }
      const src = el.currentSrc || el.src;
      if (!src) return;
      setMedia({ type: 'image', src, alt: el.alt || '' });
      e.preventDefault();
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  // Escape closes + body scroll lock while open.
  useEffect(() => {
    if (!media) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setMedia(null);
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [media]);

  if (!media) return <style>{LIGHTBOX_STYLES}</style>;

  return createPortal(
    <>
      <style>{LIGHTBOX_STYLES}</style>
      <div
        className="lb-overlay fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-8"
        onClick={() => setMedia(null)}
        role="dialog"
        aria-modal="true"
        aria-label={media.alt || 'Media viewer'}
      >
        {/* Close */}
        <button
          type="button"
          onClick={() => setMedia(null)}
          aria-label="Close"
          className="absolute top-4 end-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <HiXMark className="h-6 w-6" />
        </button>

        {media.type === 'image' ? (
          <img
            src={media.src}
            alt={media.alt}
            onClick={(e) => e.stopPropagation()}
            className="lb-media max-h-[90vh] max-w-full rounded-xl object-contain shadow-2xl"
          />
        ) : (
          <video
            src={media.src}
            controls
            autoPlay
            onClick={(e) => e.stopPropagation()}
            className="lb-media max-h-[90vh] max-w-full rounded-xl shadow-2xl"
          />
        )}

        {media.alt && (
          <p className="absolute bottom-5 start-0 end-0 px-6 text-center text-sm text-white/80 truncate">
            {media.alt}
          </p>
        )}
      </div>
    </>,
    document.body
  );
}
