"use client";

import { ProductImage } from "@/components/product-image";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { useState } from "react";

export function ProductGallery({
  images,
  fallbackImage,
  name,
  hasOffer,
  discountPercent,
  offerBadgeText,
}: {
  images?: string[] | null;
  fallbackImage?: string | null;
  name: string;
  hasOffer?: boolean;
  discountPercent?: number;
  offerBadgeText?: string;
}) {
  const allImages = (
    images && images.length > 0 ? images : fallbackImage ? [fallbackImage] : []
  ).filter(Boolean);

  const [selectedIndex, setSelectedIndex] = useState(0);

  const currentImage = allImages[selectedIndex] || fallbackImage || null;

  function handlePrev() {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
  }

  function handleNext() {
    setSelectedIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Main Image View */}
      <div className="crop-frame surface relative aspect-square overflow-hidden rounded-lg">
        <ProductImage
          src={currentImage}
          alt={name}
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
          className="object-cover transition-all duration-300"
        />

        {/* Offer Discount Badge */}
        {hasOffer && (
          <span className="absolute start-4 top-4 z-10 rounded-full bg-red-600 px-3.5 py-1 text-sm font-bold tracking-tight text-white shadow-md">
            {offerBadgeText || `${discountPercent}%`}
          </span>
        )}

        {/* Carousel arrows if multiple images */}
        {allImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute start-2 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-paper/85 text-ink shadow-md backdrop-blur-xs transition hover:bg-paper hover:scale-105"
              aria-label="Previous image"
            >
              <IconChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute end-2 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-paper/85 text-ink shadow-md backdrop-blur-xs transition hover:bg-paper hover:scale-105"
              aria-label="Next image"
            >
              <IconChevronRight size={20} />
            </button>

            {/* Slide counter indicator */}
            <div className="absolute bottom-3 end-3 z-10 rounded-full bg-ink/70 px-2.5 py-0.5 text-xs font-semibold text-paper backdrop-blur-xs tabular">
              {selectedIndex + 1} / {allImages.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails strip */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
          {allImages.map((src, idx) => {
            const isActive = idx === selectedIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`relative aspect-square w-18 flex-shrink-0 overflow-hidden rounded-md border-2 transition-all ${
                  isActive
                    ? "border-accent ring-2 ring-accent/30 scale-95"
                    : "border-line opacity-70 hover:opacity-100"
                }`}
                aria-label={`View image ${idx + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`${name} thumbnail ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
