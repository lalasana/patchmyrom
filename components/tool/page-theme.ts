import type { CardArtAccent } from "@/components/ui/CardArt";

/** Static class sets per page accent (Tailwind needs whole class names in the source). */
export const PAGE_THEME: Record<
  CardArtAccent,
  { text: string; soft: string; border: string; borderL: string; glow: string; stripe: string; tile: string; seg: string }
> = {
  green: {
    text: "text-accent-green",
    soft: "bg-accent-green/10",
    border: "border-accent-green/40",
    borderL: "border-l-accent-green",
    glow: "from-accent-green/25 via-accent-blue/15 to-accent-purple/10",
    stripe: "from-accent-green via-accent-blue to-accent-purple",
    tile: "border-accent-green/30 bg-accent-green/[0.06]",
    seg: "border-accent-green/50 bg-accent-green/15 text-accent-green",
  },
  blue: {
    text: "text-accent-blue",
    soft: "bg-accent-blue/10",
    border: "border-accent-blue/40",
    borderL: "border-l-accent-blue",
    glow: "from-accent-blue/25 via-accent-purple/15 to-accent-green/10",
    stripe: "from-accent-blue via-accent-purple to-accent-green",
    tile: "border-accent-blue/30 bg-accent-blue/[0.06]",
    seg: "border-accent-blue/50 bg-accent-blue/15 text-accent-blue",
  },
  purple: {
    text: "text-accent-purple",
    soft: "bg-accent-purple/10",
    border: "border-accent-purple/40",
    borderL: "border-l-accent-purple",
    glow: "from-accent-purple/30 via-accent-blue/15 to-accent-green/10",
    stripe: "from-accent-purple via-accent-blue to-accent-green",
    tile: "border-accent-purple/30 bg-accent-purple/[0.06]",
    seg: "border-accent-purple/50 bg-accent-purple/15 text-accent-purple",
  },
  amber: {
    text: "text-amber-300",
    soft: "bg-amber-400/10",
    border: "border-amber-400/40",
    borderL: "border-l-amber-400",
    glow: "from-amber-400/25 via-rose-400/15 to-accent-purple/10",
    stripe: "from-amber-400 via-rose-400 to-accent-purple",
    tile: "border-amber-400/30 bg-amber-400/[0.06]",
    seg: "border-amber-400/50 bg-amber-400/15 text-amber-300",
  },
  rose: {
    text: "text-rose-300",
    soft: "bg-rose-400/10",
    border: "border-rose-400/40",
    borderL: "border-l-rose-400",
    glow: "from-rose-400/25 via-accent-purple/15 to-accent-blue/10",
    stripe: "from-rose-400 via-accent-purple to-accent-blue",
    tile: "border-rose-400/30 bg-rose-400/[0.06]",
    seg: "border-rose-400/50 bg-rose-400/15 text-rose-300",
  },
};
