"use client";

export function prepareWhatsAppPopup(): Window | null {
  try {
    return window.open("about:blank", "engimart-whatsapp");
  } catch {
    return null;
  }
}

/** Attempts to open WhatsApp in the prepared popup tab. Returns true if successful. */
export function openPreparedWhatsApp(popup: Window | null, url: string): boolean {
  if (popup && !popup.closed) {
    try {
      popup.location.href = url;
      popup.focus();
      return true;
    } catch {
      popup.close();
      return false;
    }
  }
  return false;
}
