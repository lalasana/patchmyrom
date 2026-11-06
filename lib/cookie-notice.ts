// The cookie notice is informational only: this module remembers that it was dismissed, nothing more.
// Nothing here (or anywhere else) starts, stops or configures Google Tag Manager, Analytics or AdSense;
// those are plain tags in the root layout's <head> and run for every visitor.

export const COOKIE_NOTICE_STORAGE_KEY = "patchmyrom_cookie_notice_dismissed";
/** Key written by the previous consent banner; a visitor who already answered it should not see this one. */
const LEGACY_CONSENT_STORAGE_KEY = "patchmyrom_cookie_consent";
const UPDATED_EVENT = "patchmyrom_cookie_notice_updated";

// Used when localStorage is unavailable (private mode, blocked storage): hide for the rest of this page session.
let dismissedInMemory = false;

export function isNoticeDismissed(): boolean {
  if (typeof window === "undefined") return true;
  if (dismissedInMemory) return true;
  try {
    return (
      window.localStorage.getItem(COOKIE_NOTICE_STORAGE_KEY) !== null ||
      window.localStorage.getItem(LEGACY_CONSENT_STORAGE_KEY) !== null
    );
  } catch {
    return false;
  }
}

export function dismissNotice() {
  dismissedInMemory = true;
  try {
    window.localStorage.setItem(COOKIE_NOTICE_STORAGE_KEY, "1");
  } catch {
    // Storage blocked: the in-memory flag still hides the notice for this visit.
  }
  window.dispatchEvent(new Event(UPDATED_EVENT));
}

export function subscribeToNotice(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(UPDATED_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(UPDATED_EVENT, callback);
  };
}
