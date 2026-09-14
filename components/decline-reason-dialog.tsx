"use client";

import { PendingLabel } from "@/components/pending-label";
import { useT } from "@/lib/i18n/provider";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export function DeclineReasonDialog({
  open,
  reason,
  pending,
  onReasonChange,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  reason: string;
  pending: boolean;
  onReasonChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useT();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const onCancelRef = useRef(onCancel);
  const pendingRef = useRef(pending);

  useEffect(() => {
    onCancelRef.current = onCancel;
    pendingRef.current = pending;
  }, [onCancel, pending]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pendingRef.current) {
        onCancelRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="decline-dialog"
      role="presentation"
      onClick={() => {
        if (!pending) onCancel();
      }}
    >
      <div
        className="decline-dialog-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="decline-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="decline-dialog-title">{t("admin.declineReason")}</h2>
        <p className="text-sm text-ink-soft">{t("admin.declineReasonHelp")}</p>
        <textarea
          ref={textareaRef}
          rows={4}
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          maxLength={500}
          placeholder={t("admin.declineReasonPlaceholder")}
        />
        <div className="flex flex-wrap gap-4">
          <button
            className="btn btn-primary"
            type="button"
            disabled={pending}
            onClick={onConfirm}
          >
            <PendingLabel
              pending={pending}
              idle={t("admin.confirmDecline")}
              busy={t("admin.saving")}
            />
          </button>
          <button
            className="btn btn-secondary"
            type="button"
            disabled={pending}
            onClick={onCancel}
          >
            {t("admin.cancel")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
