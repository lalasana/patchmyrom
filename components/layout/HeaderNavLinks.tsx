"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinks } from "@/lib/site";

export default function HeaderNavLinks() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1 sm:flex">
      {navLinks.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={`group relative rounded-md border-2 px-3.5 py-1.5 text-base font-medium transition-all ${
              isActive
                ? "border-accent-green/60 bg-accent-green/10 text-accent-green shadow-[0_3px_0_0_rgba(0,0,0,0.35)]"
                : "border-transparent text-muted hover:-translate-y-0.5 hover:border-border hover:bg-card hover:text-foreground"
            }`}
          >
            {link.label}
            <span
              aria-hidden
              className={`absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 -translate-x-full bg-accent-green transition-opacity [clip-path:polygon(0_0,100%_50%,0_100%)] ${
                isActive ? "opacity-100" : "opacity-0 group-hover:opacity-70"
              }`}
            />
          </Link>
        );
      })}
    </nav>
  );
}
