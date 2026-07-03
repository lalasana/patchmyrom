export type CookieConsent = {
  necessary: true;
  analytics: boolean;
  ads: boolean;
};

export const COOKIE_CONSENT_STORAGE_KEY = "patchmyrom_cookie_consent";
export const COOKIE_CONSENT_UPDATED_EVENT = "patchmyrom_cookie_consent_updated";

export const defaultConsent: CookieConsent = {
  necessary: true,
  analytics: false,
  ads: false,
};

function parseConsent(raw: string | null): CookieConsent | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CookieConsent>;
    return {
      necessary: true,
      analytics: Boolean(parsed.analytics),
      ads: Boolean(parsed.ads),
    };
  } catch {
    return null;
  }
}

// useSyncExternalStore requires getSnapshot to return a stable reference
// when the underlying value hasn't changed, so the raw string is cached
// alongside the parsed result.
let cachedRaw: string | null | undefined;
let cachedConsent: CookieConsent | null = null;

export function readStoredConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedConsent = parseConsent(raw);
  }
  return cachedConsent;
}

export function writeStoredConsent(consent: CookieConsent) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(consent));
  window.dispatchEvent(new Event(COOKIE_CONSENT_UPDATED_EVENT));
}

export function subscribeToStoredConsent(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, callback);
  };
}
