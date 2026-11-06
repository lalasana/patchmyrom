import type { NavGroup } from "@/lib/site";

/** Static class sets per accent (Tailwind needs whole class names in the source). */
export const NAV_ACCENT: Record<
  NavGroup["accent"],
  { bar: string; badge: string; activeItem: string; hoverItem: string; text: string }
> = {
  purple: {
    bar: "from-accent-purple via-accent-blue to-accent-green",
    badge: "border-accent-purple/50 bg-accent-purple/15 text-accent-purple",
    activeItem: "border-accent-purple/60 bg-accent-purple/10",
    hoverItem: "hover:border-accent-purple/40 hover:bg-accent-purple/5",
    text: "text-accent-purple",
  },
  green: {
    bar: "from-accent-green via-accent-blue to-accent-purple",
    badge: "border-accent-green/50 bg-accent-green/15 text-accent-green",
    activeItem: "border-accent-green/60 bg-accent-green/10",
    hoverItem: "hover:border-accent-green/40 hover:bg-accent-green/5",
    text: "text-accent-green",
  },
  blue: {
    bar: "from-accent-blue via-accent-green to-accent-purple",
    badge: "border-accent-blue/50 bg-accent-blue/15 text-accent-blue",
    activeItem: "border-accent-blue/60 bg-accent-blue/10",
    hoverItem: "hover:border-accent-blue/40 hover:bg-accent-blue/5",
    text: "text-accent-blue",
  },
  amber: {
    bar: "from-amber-400 via-rose-400 to-accent-purple",
    badge: "border-amber-400/50 bg-amber-400/15 text-amber-300",
    activeItem: "border-amber-400/60 bg-amber-400/10",
    hoverItem: "hover:border-amber-400/40 hover:bg-amber-400/5",
    text: "text-amber-300",
  },
};

/** usePathname() returns "/x/" with trailingSlash; compare without it. */
export function normalizePath(pathname: string | null): string {
  if (!pathname) return "/";
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}
