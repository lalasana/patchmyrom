"use client";

import Link from "next/link";
import { useEffect } from "react";
import GbaEmulatorIcon from "@/components/ui/GbaEmulatorIcon";
import { IconArrowRight, IconPlay } from "@/components/ui/icons";
import {
  GBA_EMULATOR_DEVELOPER,
  GBA_EMULATOR_NAME,
  GBA_EMULATOR_PAGE,
  GBA_EMULATOR_SYSTEMS,
  GBA_EMULATOR_TITLE,
  GBA_EMULATOR_URL,
  type GbaEmulatorPlacement,
} from "@/lib/gba-emulator";
import { trackGbaEmulator, useIsAndroid } from "@/lib/gba-emulator-client";

type GbaEmulatorCtaProps = {
  placement: GbaEmulatorPlacement;
  className?: string;
  /** Hide the "Learn more" link (used on the emulator page itself). */
  hideLearnMore?: boolean;
  /** Smaller layout without the description, for tight spots such as the patch-success screen. */
  compact?: boolean;
  /** Extra one-line scope note shown under the description (e.g. "GBA hacks only"). */
  note?: string;
};

const playButtonClasses =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-accent-blue to-accent-green px-5 py-3 text-sm font-semibold text-background shadow-lg shadow-accent-blue/20 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto";

/** Google Play button that tracks its own clicks. Reused by the emulator page. */
export function GooglePlayButton({
  placement,
  children,
  className = "",
}: {
  placement: GbaEmulatorPlacement;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={GBA_EMULATOR_URL}
      target="_blank"
      rel="noopener"
      onClick={() => trackGbaEmulator("gba_emulator_cta_click", placement)}
      className={`${playButtonClasses} ${className}`}
    >
      <IconPlay className="h-5 w-5" />
      {children ?? "Get it on Google Play"}
    </a>
  );
}

/** "GBA · GBC · GB" compatibility chips — deliberately no DS chip anywhere. */
export function SystemChips({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-1.5 ${className}`} aria-label="Supported systems">
      {GBA_EMULATOR_SYSTEMS.map((system) => (
        <li
          key={system}
          className="rounded-md border border-accent-blue/30 bg-accent-blue/10 px-2 py-0.5 text-xs font-semibold tracking-wide text-accent-blue"
        >
          {system}
        </li>
      ))}
    </ul>
  );
}

/**
 * Recommendation card. The static HTML always contains the desktop/iOS copy (so crawlers and
 * non-Android visitors get a stable page); Android visitors get action-oriented copy swapped in
 * after hydration. Inline, never a popup.
 */
export default function GbaEmulatorCta({
  placement,
  className = "",
  hideLearnMore = false,
  compact = false,
  note,
}: GbaEmulatorCtaProps) {
  const isAndroid = useIsAndroid();

  useEffect(() => {
    trackGbaEmulator("gba_emulator_cta_view", placement);
  }, [placement]);

  const description = isAndroid
    ? "Import your patched game and play it right on this phone — with saves, cheats and custom touch controls."
    : "Play your own patched GBA, GBC and GB games on Android — with saves, cheats and custom touch controls.";

  return (
    <aside
      aria-label={`${GBA_EMULATOR_TITLE} for Android`}
      className={`relative overflow-hidden rounded-xl border-2 border-accent-blue/40 bg-gradient-to-br from-accent-blue/15 via-card to-accent-green/10 p-4 shadow-[4px_4px_0_0_rgba(0,0,0,0.4)] sm:p-5 ${className}`}
    >
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="flex min-w-0 items-start gap-3 text-left sm:gap-4">
          <GbaEmulatorIcon size={compact ? 48 : 64} className={compact ? "h-12 w-12" : "h-14 w-14 sm:h-16 sm:w-16"} />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent-blue">
              {isAndroid ? "Play it on this phone" : "Play it on Android"}
            </p>
            <p className="mt-0.5 text-base font-semibold leading-snug text-foreground sm:text-lg">{GBA_EMULATOR_TITLE}</p>
            <p className="text-xs text-muted">
              by {GBA_EMULATOR_DEVELOPER} · Free on Google Play
            </p>
            <SystemChips className="mt-2" />
            {!compact && <p className="mt-2 text-sm text-muted">{description}</p>}
            {note && <p className="mt-1.5 text-xs text-muted/80">{note}</p>}
          </div>
        </div>
        <div className="flex flex-none flex-col gap-1 sm:min-w-52 sm:items-stretch">
          <GooglePlayButton placement={placement}>Get it on Google Play</GooglePlayButton>
          {!hideLearnMore && (
            <Link
              href={GBA_EMULATOR_PAGE}
              className="inline-flex min-h-11 items-center justify-center gap-1 text-sm font-medium text-accent-blue hover:underline sm:min-h-0 sm:py-1.5"
            >
              About {GBA_EMULATOR_NAME}
              <IconArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
