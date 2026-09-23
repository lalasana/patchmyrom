"use client";

import { useSyncExternalStore } from "react";
import { readStoredConsent } from "@/lib/cookie-consent";
import type { GbaPlayPlacement } from "@/lib/gba-play";

const noopSubscribe = () => () => {};
const detectAndroid = () => /Android/i.test(navigator.userAgent);

/** False on the server and during hydration, so the static HTML is identical for every visitor. */
export function useIsAndroid(): boolean {
  return useSyncExternalStore(noopSubscribe, detectAndroid, () => false);
}

type GtagFn = (command: "event", name: string, params: Record<string, unknown>) => void;
type AnalyticsWindow = Window & { gtag?: GtagFn; dataLayer?: unknown[] };

/**
 * Forwards to an analytics tool the page already has (gtag / dataLayer). Adds no provider,
 * and sends nothing unless the visitor opted into analytics in the cookie banner.
 */
export function trackGbaPlay(event: "gba_play_cta_view" | "gba_play_cta_click", placement: GbaPlayPlacement) {
  if (typeof window === "undefined") return;
  if (!readStoredConsent()?.analytics) return;
  const w = window as AnalyticsWindow;
  const params = { placement };
  if (typeof w.gtag === "function") {
    w.gtag("event", event, params);
  } else if (Array.isArray(w.dataLayer)) {
    w.dataLayer.push({ event, ...params });
  }
}
