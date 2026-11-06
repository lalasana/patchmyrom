"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { dismissNotice, isNoticeDismissed, subscribeToNotice } from "@/lib/cookie-notice";

// Server (and first hydration) render: treated as dismissed, so the static HTML never contains the banner
// and returning visitors never see a flash. New visitors get it right after hydration.
const getServerSnapshot = () => true;

/**
 * Small floating cookie notice. Visual only: "Accept" hides it and remembers that. It has no connection
 * to Google Tag Manager, Analytics or AdSense, which load from the root layout regardless.
 */
export default function CookieNotice() {
  const dismissed = useSyncExternalStore(subscribeToNotice, isNoticeDismissed, getServerSnapshot);
  if (dismissed) return null;

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[24rem]"
    >
      <div className="overflow-hidden rounded-2xl border-2 border-border bg-card shadow-[0_18px_44px_-10px_rgba(0,0,0,0.85)]">
        <div aria-hidden className="h-1 w-full bg-gradient-to-r from-accent-green via-accent-blue to-accent-purple" />
        <div className="flex items-start gap-3 p-4">
          <span
            aria-hidden
            className="flex h-10 w-10 flex-none items-center justify-center rounded-xl border-2 border-amber-400/50 bg-amber-400/15"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
              <path
                d="M12 3a9 9 0 1 0 9 9 4 4 0 0 1-4-4 4 4 0 0 1-4-4 1 1 0 0 0-1-1z"
                fill="#fbbf24"
                stroke="#0a0b1c"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <circle cx="9" cy="10" r="1.3" fill="#0a0b1c" />
              <circle cx="14" cy="15" r="1.3" fill="#0a0b1c" />
              <circle cx="8.5" cy="15.5" r="1" fill="#0a0b1c" />
            </svg>
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <p className="text-sm leading-relaxed text-muted">
              Our website uses cookies to improve your experience. Learn more about our{" "}
              <Link href="/privacy#cookies" className="font-semibold text-accent-blue underline-offset-2 hover:underline">
                cookie policy
              </Link>
              .
            </p>
            <Button type="button" onClick={dismissNotice} className="min-h-11 self-start px-6 py-2">
              Accept
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
