import type { ReactNode } from "react";
import CardArt, { type CardArtAccent, type CardArtName } from "@/components/ui/CardArt";

/**
 * Banner for the top of inner pages. The page's own <h1>, intro and badges go inside as children
 * (so headings and copy stay exactly where they were); the illustration is decorative.
 */
export default function PageHero({
  art,
  accent = "green",
  children,
}: {
  art: CardArtName;
  accent?: CardArtAccent;
  children: ReactNode;
}) {
  return (
    <header className="page-hero retro-window relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-accent-green/20 via-accent-blue/15 to-accent-purple/20 blur-3xl" />
      <div className="relative flex flex-col items-center gap-6 p-6 sm:p-9 md:flex-row md:justify-between md:gap-10">
        <div className="flex w-full min-w-0 flex-1 flex-col gap-3">{children}</div>
        <div className="order-first w-full max-w-[280px] flex-none md:order-last">
          <CardArt
            name={art}
            accent={accent}
            className="aspect-[3/1] w-full rounded-2xl md:aspect-[2/1] border border-border/70 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.9)]"
          />
        </div>
      </div>
    </header>
  );
}
