import Link from "next/link";
import CardArt, { type CardArtAccent, type CardArtName } from "@/components/ui/CardArt";
import { IconArrowRight } from "@/components/ui/icons";

export type RelatedGuide = {
  href: string;
  title: string;
  description: string;
};

/** Decorative art per destination, so every guide card gets a fitting picture. */
function artFor(href: string): { art: CardArtName; accent: CardArtAccent } {
  if (href === "/") return { art: "cartridge", accent: "green" };
  if (href.startsWith("/patch-formats")) return { art: "formats", accent: "blue" };
  if (href.startsWith("/troubleshooting")) return { art: "troubleshoot", accent: "amber" };
  if (href.startsWith("/pokemon")) return { art: "controller", accent: "purple" };
  if (href.startsWith("/how-to")) return { art: "guide", accent: "blue" };
  if (href.startsWith("/gba-emulator")) return { art: "controller", accent: "purple" };
  if (/patcher/.test(href)) return { art: "patch", accent: "green" };
  return { art: "guide", accent: "blue" };
}

export default function RelatedGuides({ items }: { items: RelatedGuide[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {items.map((item) => {
        const { art, accent } = artFor(item.href);
        return (
          <Link key={item.href} href={item.href} className="pixel-card group flex flex-col overflow-hidden sm:flex-row">
            <CardArt name={art} accent={accent} className="h-28 sm:h-auto sm:w-40 sm:flex-none sm:border-b-0 sm:border-r" />
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-5 py-4">
              <span className="flex items-center justify-between gap-2 text-lg font-bold leading-snug text-foreground">
                {item.title}
                <IconArrowRight className="h-4 w-4 flex-none text-accent-green opacity-60 transition-transform group-hover:translate-x-1 group-hover:opacity-100" />
              </span>
              <span className="text-sm text-muted">{item.description}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
