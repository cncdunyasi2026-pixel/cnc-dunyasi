"use client";

import { useEffect, useRef } from "react";
import { WatermarkOverlayLayer } from "@/components/ui/WatermarkedImage";

type ImageLightboxProps = {
  images: string[];
  alt: string;
  isOpen: boolean;
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
};

export default function ImageLightbox({
  images,
  alt,
  isOpen,
  index,
  onClose,
  onPrev,
  onNext,
}: ImageLightboxProps) {
  const touchStartXRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        onNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        onPrev();
      } else if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose, onNext, onPrev]);

  if (!isOpen || images.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold text-white"
      >
        Kapat
      </button>

      {images.length > 1 ? (
        <>
          <button
            type="button"
            onClick={onPrev}
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white"
            aria-label="Onceki gorsel"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={onNext}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white"
            aria-label="Sonraki gorsel"
          >
            ›
          </button>
        </>
      ) : null}

      <div
        className="relative h-full overflow-hidden"
        onTouchStart={(event) => {
          touchStartXRef.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          if (images.length <= 1) return;

          const startX = touchStartXRef.current;
          const endX = event.changedTouches[0]?.clientX ?? null;

          if (startX === null || endX === null) {
            return;
          }

          const deltaX = endX - startX;
          if (Math.abs(deltaX) < 40) {
            return;
          }

          if (deltaX < 0) {
            onNext();
          } else {
            onPrev();
          }
        }}
      >
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {images.map((image, imageIndex) => (
            <div key={`${image}-lightbox-${imageIndex}`} className="flex h-full min-w-full items-center justify-center p-4">
              <div className="relative inline-block max-h-full max-w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt={`${alt} buyuk gorsel ${imageIndex + 1}`}
                  className="max-h-[calc(100vh-2rem)] max-w-full object-contain"
                  draggable={false}
                />
                <WatermarkOverlayLayer size="lg" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {images.length > 1 ? (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-xs text-white">
          {index + 1} / {images.length}
        </div>
      ) : null}
    </div>
  );
}
