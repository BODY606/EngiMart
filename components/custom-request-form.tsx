"use client";

import { customRequestSchema } from "@/lib/validations";
import { PendingLabel } from "@/components/pending-label";
import { useT } from "@/lib/i18n/provider";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CustomRequestForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const t = useT();

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const parsed = customRequestSchema.safeParse({
      description: formData.get("description"),
      suggestedLocation: formData.get("suggestedLocation"),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t("auth.checkForm"));
      setPending(false);
      return;
    }
    const response = await fetch("/api/custom-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    const payload = (await response.json()) as { error?: string; id?: string };
    if (!response.ok) {
      setError(payload.error || t("request.fail"));
      setPending(false);
      return;
    }
    router.push(`/requests/${payload.id}`);
  }

  return (
    <form
      className="surface stack mt-8 p-6"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(new FormData(event.currentTarget));
      }}
    >
      <div>
        <label htmlFor="description">{t("request.what")}</label>
        <textarea
          id="description"
          name="description"
          required
          placeholder={t("request.whatPh")}
        />
      </div>
      <div>
        <label htmlFor="suggestedLocation">{t("request.where")}</label>
        <input
          id="suggestedLocation"
          name="suggestedLocation"
          placeholder={t("request.wherePh")}
        />
      </div>
      {error && <p className="field-error">{error}</p>}
      <button className="btn btn-primary" disabled={pending}>
        <PendingLabel
          pending={pending}
          idle={t("request.send")}
          busy={t("request.sending")}
        />
      </button>
    </form>
  );
}
