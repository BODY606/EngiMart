"use client";

import Image from "next/image";

export function ProductImage({
  src,
  alt,
  sizes,
  priority = false,
  className,
}: {
  src: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const url = src || "/products/fallback.svg";
  const remote = url.startsWith("http://") || url.startsWith("https://");

  if (!remote) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={alt}
        className={`h-full w-full ${className ?? ""}`}
        decoding="async"
      />
    );
  }

  return (
    <Image
      src={url}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
    />
  );
}
