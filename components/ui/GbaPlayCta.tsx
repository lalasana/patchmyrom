"use client";

import Link from "next/link";
import { useEffect } from "react";
import GbaPlayIcon from "@/components/ui/GbaPlayIcon";
import { IconArrowRight, IconPlay } from "@/components/ui/icons";
import { GBA_PLAY_NAME, GBA_PLAY_PAGE, GBA_PLAY_URL, type GbaPlayPlacement } from "@/lib/gba-play";
import { trackGbaPlay, useIsAndroid } from "@/lib/gba-play-client";

type GbaPlayCtaProps = {
  placement: GbaPlayPlacement;
  className?: string;
  /** Hide the "Learn more" link (used on the GBA Play page itself). */
  hideLearnMore?: boolean;
};

const playButtonClasses =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-accent-blue to-accent-green px-5 py-3 text-sm font-semibold text-background shadow-lg shadow-accent-blue/20 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto";

/** Google Play button that tracks its own clicks. Reused by the GBA Play page. */
export function GooglePlayButton({
  placement,
  children,
  className = "",
}: {
  placement: GbaPlayPlacement;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={GBA_PLAY_URL}
      target="_blank"
      rel="noopener"
      onClick={() => trackGbaPlay("gba_play_cta_click", placement)}
      className={`${playButtonClasses} ${className}`}
    >
      <IconPlay className="h-5 w-5" />
      {children ?? "Get it on Google Play"}
    </a>
  );
}

/**
 * Recommendation card. The static HTML always contains the desktop/iOS copy (so crawlers and
 * non-Android visitors get a stable page); Android visitors get stronger, action-oriented copy
 * swapped in after hydration.
 */
export default function GbaPlayCta({ placement, className = "", hideLearnMore = false }: GbaPlayCtaProps) {
  const isAndroid = useIsAndroid();

  useEffect(() => {
    trackGbaPlay("gba_play_cta_view", placement);
  }, [placement]);

  return (
    <div
      className={`rounded-xl border border-accent-blue/30 bg-gradient-to-br from-accent-blue/10 via-card to-accent-green/5 p-4 sm:p-5 ${className}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3 text-left">
          <GbaPlayIcon size={48} className="h-12 w-12" />
          <div className="min-w-0">
            <p className="text-base font-semibold text-foreground">
              {GBA_PLAY_NAME} — {isAndroid ? "Best GBA Emulator" : "recommended Android emulator"}
            </p>
            <p className="mt-0.5 text-sm text-muted">
              {isAndroid
                ? "Play your patched ROM on Android with GBA Play."
                : "Want the best way to play patched GBA games on Android? Try GBA Play."}
            </p>
          </div>
        </div>
        <div className="flex flex-none flex-col gap-2 sm:items-end">
          <GooglePlayButton placement={placement}>
            {isAndroid ? "Get GBA Play" : "Get it on Google Play"}
          </GooglePlayButton>
          {!hideLearnMore && (
            <Link
              href={GBA_PLAY_PAGE}
              className="inline-flex min-h-11 items-center justify-center gap-1 text-sm font-medium text-accent-blue hover:underline sm:min-h-0"
            >
              About {GBA_PLAY_NAME}
              <IconArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
