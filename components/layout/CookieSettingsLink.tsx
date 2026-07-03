"use client";

import { useCookieConsent } from "@/components/layout/CookieConsentContext";

export default function CookieSettingsLink() {
  const { openSettings } = useCookieConsent();

  return (
    <button
      type="button"
      onClick={openSettings}
      className="text-sm text-muted transition-colors hover:text-foreground"
    >
      Cookie Settings
    </button>
  );
}
