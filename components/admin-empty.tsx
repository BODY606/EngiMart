"use client";

import {
  IconMessage,
  IconPackage,
  IconShoppingCart,
} from "@tabler/icons-react";

const icons = {
  orders: IconShoppingCart,
  requests: IconMessage,
  products: IconPackage,
};

export function AdminEmpty({
  icon,
  title,
  copy,
}: {
  icon: keyof typeof icons;
  title: string;
  copy: string;
}) {
  const Icon = icons[icon];
  return (
    <div className="surface">
      <div className="admin-empty">
        <span className="text-ink-soft">
          <Icon size={32} stroke={1.4} aria-hidden />
        </span>
        <p className="admin-empty-title">{title}</p>
        <p className="admin-empty-copy">{copy}</p>
      </div>
    </div>
  );
}
