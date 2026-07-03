"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { CookieConsentContext } from "@/components/layout/CookieConsentContext";
import { Button } from "@/components/ui/Button";
import {
  type CookieConsent,
  defaultConsent,
  readStoredConsent,
  subscribeToStoredConsent,
  writeStoredConsent,
} from "@/lib/cookie-consent";

function getServerSnapshot() {
  return null;
}

export default function CookieConsentProvider({ children }: { children: ReactNode }) {
  const storedConsent = useSyncExternalStore(
    subscribeToStoredConsent,
    readStoredConsent,
    getServerSnapshot
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftConsent, setDraftConsent] = useState<CookieConsent>(
    storedConsent ?? defaultConsent
  );

  function openSettings() {
    setDraftConsent(storedConsent ?? defaultConsent);
    setIsModalOpen(true);
  }

  function persist(consent: CookieConsent) {
    // Consent is only ever written to localStorage. No analytics or ads
    // scripts are loaded here regardless of the choice made.
    writeStoredConsent(consent);
    setIsModalOpen(false);
  }

  function acceptAll() {
    persist({ necessary: true, analytics: true, ads: true });
  }

  function rejectNonEssential() {
    persist({ necessary: true, analytics: false, ads: false });
  }

  function saveCustom() {
    persist(draftConsent);
  }

  const showBanner = storedConsent === null && !isModalOpen;

  return (
    <CookieConsentContext.Provider value={{ openSettings }}>
      {children}

      {showBanner && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 px-4 py-4 shadow-2xl shadow-black/30 backdrop-blur-md sm:px-6">
          <div className="container-page flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">
              We use cookies for essential site functionality. Analytics and ads cookies are only
              enabled if you accept them. No such scripts are loaded by default.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={openSettings}>
                Customize
              </Button>
              <Button type="button" variant="outline" onClick={rejectNonEssential}>
                Reject Non-Essential
              </Button>
              <Button type="button" variant="primary" onClick={acceptAll}>
                Accept All
              </Button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
          <div className="glow-border w-full max-w-md rounded-xl">
            <div className="card w-full max-w-md rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground">Cookie Preferences</h2>
              <p className="mt-1 text-sm text-muted">
                Choose which categories of cookies you allow. You can change this anytime from the
                &ldquo;Cookie Settings&rdquo; link in the footer.
              </p>

              <div className="mt-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-card/60 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-foreground">Necessary</p>
                    <p className="text-xs text-muted">Required for the site to function.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked
                    disabled
                    className="h-4 w-4 accent-accent-green"
                  />
                </div>

                <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-card/60 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-foreground">Analytics</p>
                    <p className="text-xs text-muted">Helps us understand site usage.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={draftConsent.analytics}
                    onChange={(event) =>
                      setDraftConsent((prev) => ({ ...prev, analytics: event.target.checked }))
                    }
                    className="h-4 w-4 accent-accent-blue"
                  />
                </div>

                <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-card/60 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-foreground">Ads / Marketing</p>
                    <p className="text-xs text-muted">Used to show relevant ads.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={draftConsent.ads}
                    onChange={(event) =>
                      setDraftConsent((prev) => ({ ...prev, ads: event.target.checked }))
                    }
                    className="h-4 w-4 accent-accent-blue"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" variant="primary" onClick={saveCustom}>
                  Save choice
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </CookieConsentContext.Provider>
  );
}
