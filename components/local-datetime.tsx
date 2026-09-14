"use client";

import { formatOrderTimestamp } from "@/lib/datetime";

export function LocalDateTime({
  iso,
  locale = "en",
  className,
}: {
  iso: string;
  locale?: string;
  className?: string;
}) {
  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {formatOrderTimestamp(iso, locale)}
    </time>
  );
}
