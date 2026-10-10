import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi2';

/**
 * Image carousel component for displaying post images using Embla Carousel
 * @param {Object} props
 * @param {string[]} props.images - Array of image URLs
 * @param {string} props.className - Optional wrapper classes
 */
export default function ImageCarousel({ images, className = '' }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState({});

  const scrollPrev = useCallback((e) => {
    e?.stopPropagation();
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback((e) => {
    e?.stopPropagation();
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback((index) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => emblaApi.off('select', onSelect);
  }, [emblaApi, onSelect]);

  if (!images || images.length === 0) return null;

  return (
    <div dir="ltr" className={`relative w-full min-w-0 overflow-hidden ${className}`}>
      {/* Embla Viewport */}
      <div ref={emblaRef} className="overflow-hidden rounded-lg">
        <div className="flex items-start">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative flex-[0_0_100%] min-w-0 bg-neutral-100"
            >
              <img
                src={image}
                alt={`Image ${index + 1} of ${images.length}`}
                className={`block w-full h-auto max-h-[75vh] sm:max-h-[540px] object-contain ${
                  imageLoading[index] ? "opacity-0" : "opacity-100"
                } transition-opacity duration-200`}
                onLoad={() =>
                  setImageLoading((prev) => ({ ...prev, [index]: false }))
                }
                loading="lazy"
                onError={() => setImageLoading((prev) => ({ ...prev, [index]: false }))}
              />

              {/* Loading skeleton */}
              {imageLoading[index] !== false && (
                <div className="absolute inset-0 animate-pulse bg-neutral-200" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows (only if multiple images) */}
      {images.length > 1 && (
        <>
        <div className='hidden lg:flex'>
          {/* Previous button */}
          <button
            onClick={scrollPrev}
            className="absolute start-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-neutral-100/95 hover:bg-neutral-100 shadow-elevation-2 flex items-center justify-center transition-all hover:scale-110 z-10"
            aria-label="Previous image"
          >
            <HiChevronLeft className="w-6 h-6 text-neutral-800" />
          </button>

          {/* Next button */}
          <button
            onClick={scrollNext}
            className="absolute end-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-neutral-100/95 hover:bg-neutral-100 shadow-elevation-2 flex items-center justify-center transition-all hover:scale-110 z-10"
            aria-label="Next image"
          >
            <HiChevronRight className="w-6 h-6 text-neutral-800" />
          </button>
          </div>

          {/* Image counter */}
          <div className="absolute top-3 end-3 px-3 py-1.5 bg-neutral-50/80 text-neutral-900 text-caption font-medium rounded-full backdrop-blur-sm">
            {selectedIndex + 1} / {images.length}
          </div>

          {/* Dot indicators */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 rounded-full bg-black/60 backdrop-blur-sm">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={`transition-all ${
                  index === selectedIndex
                    ? "w-8 h-2 bg-white rounded-full"
                    : "w-2 h-2 bg-white/60 hover:bg-white/80 rounded-full"
                }`}
                aria-label={`Go to image ${index + 1}`}
                aria-current={index === selectedIndex}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
