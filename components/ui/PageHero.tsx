import type { ReactNode } from "react";
import CardArt, { CARD_ART_ACCENTS, type CardArtAccent, type CardArtName } from "@/components/ui/CardArt";
import PlatformArt, { type PlatformKey } from "@/components/ui/PlatformArt";
import { PAGE_THEME } from "@/components/tool/page-theme";

/**
 * Banner for the top of inner pages. The page's own <h1>, intro and badges go inside as children
 * (so headings and copy stay exactly where they were); the illustration is decorative.
 * Pages may pass a `platform` (own console silhouette instead of the generic cartridge) and a
 * `kicker` (small label above the heading, e.g. "Game Boy Advance · .gba").
 */
export default function PageHero({
  art,
  platform,
  accent = "green",
  kicker,
  children,
}: {
  art?: CardArtName;
  platform?: PlatformKey;
  accent?: CardArtAccent;
  kicker?: string;
  children: ReactNode;
}) {
  const theme = PAGE_THEME[accent];
  const artClass = "aspect-[3/1] w-full rounded-2xl md:aspect-[2/1] border border-border/70 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.9)]";
  return (
    <header className="page-hero retro-window relative overflow-hidden">
      <div aria-hidden className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${theme.stripe}`} />
      <div aria-hidden className={`pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-gradient-to-br ${theme.glow} blur-3xl`} />
      <div className="relative flex flex-col items-center gap-6 p-6 sm:p-9 md:flex-row md:justify-between md:gap-10">
        <div className="flex w-full min-w-0 flex-1 flex-col gap-3">
          {kicker && (
            <p className={`flex items-center gap-2 text-xs font-bold tracking-[0.14em] ${theme.text}`}>
              <span aria-hidden className="h-2 w-2 flex-none bg-current [clip-path:polygon(0_0,100%_50%,0_100%)]" />
              {kicker}
            </p>
          )}
          {children}
        </div>
        <div className="order-first w-full max-w-[280px] flex-none md:order-last">
          {platform ? (
            <div aria-hidden className={`card-art relative flex items-center justify-center overflow-hidden bg-gradient-to-br ${CARD_ART_ACCENTS[accent]} ${artClass}`}>
              <PlatformArt platform={platform} />
            </div>
          ) : (
            <CardArt name={art ?? "cartridge"} accent={accent} className={artClass} />
          )}
        </div>
      </div>
    </header>
  );
}
