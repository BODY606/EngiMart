"use client";

import { useT } from "@/lib/i18n/provider";

export function QuantityStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  const t = useT();

  return (
    <div className="qty-wrap">
      <button
        type="button"
        aria-label={t("cart.decrease")}
        onClick={() => onChange(Math.max(1, value - 1))}
      >
        −
      </button>
      <input
        aria-label={t("cart.quantity")}
        inputMode="numeric"
        value={value}
        onChange={(event) => {
          const raw = event.target.value.replace(/[^\d]/g, "");
          if (raw === "") {
            onChange(1);
            return;
          }
          onChange(Math.min(99, Math.max(1, Number(raw))));
        }}
      />
      <button
        type="button"
        aria-label={t("cart.increase")}
        onClick={() => onChange(Math.min(99, value + 1))}
      >
        +
      </button>
    </div>
  );
}
