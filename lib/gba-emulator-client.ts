"use client";

import { useSyncExternalStore } from "react";
import type { GbaEmulatorPlacement } from "@/lib/gba-emulator";

const noopSubscribe = () => () => {};
const detectAndroid = () => /Android/i.test(navigator.userAgent);

/** False on the server and during hydration, so the static HTML is identical for every visitor. */
export function useIsAndroid(): boolean {
  return useSyncExternalStore(noopSubscribe, detectAndroid, () => false);
}

type GtagFn = (command: "event", name: string, params: Record<string, unknown>) => void;
type AnalyticsWindow = Window & { gtag?: GtagFn; dataLayer?: unknown[] };

/**
 * Forwards to the analytics tool the page already has (gtag / dataLayer). Adds no provider.
 * Independent of the cookie notice: Google Tag Manager runs for every visitor.
 */
export function trackGbaEmulator(event: "gba_emulator_cta_view" | "gba_emulator_cta_click", placement: GbaEmulatorPlacement) {
  if (typeof window === "undefined") return;
  const w = window as AnalyticsWindow;
  const params = { placement };
  if (typeof w.gtag === "function") {
    w.gtag("event", event, params);
  } else if (Array.isArray(w.dataLayer)) {
    w.dataLayer.push({ event, ...params });
  }
}
