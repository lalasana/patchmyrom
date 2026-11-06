"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNav, type NavGroup } from "@/lib/site";
import { IconChevronDown } from "@/components/ui/icons";
import { NAV_ACCENT, normalizePath } from "@/components/layout/nav-theme";

/** Mobile / tablet navigation: a menu button that opens a full-width accordion (one section open at a time). */
export default function MobileMenu() {
  const pathname = normalizePath(usePathname());
  // Open state is tied to the path it was opened on, so navigating closes the menu without an effect.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const isOpen = openOn === pathname;
  const setIsOpen = (next: boolean | ((prev: boolean) => boolean)) => {
    const value = typeof next === "function" ? next(isOpen) : next;
    setOpenOn(value ? pathname : null);
    if (value) setOpenGroup(activeGroup);
  };
  const [openGroup, setOpenGroup] = useState<NavGroup["id"] | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const activeGroup = mainNav.groups.find((g) => g.items.some((i) => i.href === pathname))?.id ?? null;

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenOn(null);
        buttonRef.current?.focus();
      }
    };
    const onDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpenOn(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="mobile-nav"
        className="flex h-11 items-center gap-2 rounded-lg border-2 border-border bg-card/60 px-3.5 text-sm font-bold text-foreground transition-colors hover:border-accent-blue/50 hover:text-accent-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green"
      >
        <span aria-hidden className="flex w-4 flex-col gap-[3px]">
          <span className={`h-0.5 rounded bg-current transition-transform ${isOpen ? "translate-y-[5px] rotate-45" : ""}`} />
          <span className={`h-0.5 rounded bg-current transition-opacity ${isOpen ? "opacity-0" : ""}`} />
          <span className={`h-0.5 rounded bg-current transition-transform ${isOpen ? "-translate-y-[5px] -rotate-45" : ""}`} />
        </span>
        Menu
      </button>

      <div
        id="mobile-nav"
        hidden={!isOpen}
        className="absolute inset-x-0 top-full max-h-[calc(100dvh-4.25rem)] overflow-y-auto overscroll-contain border-b-2 border-border bg-card px-4 pb-5 pt-3 shadow-[0_24px_40px_-12px_rgba(0,0,0,0.9)] backdrop-blur-md"
      >
        <nav aria-label="Main" className="mx-auto flex max-w-xl flex-col gap-2">
          <Link
            href={mainNav.home.href}
            aria-current={pathname === "/" ? "page" : undefined}
            className={`flex min-h-12 items-center rounded-xl border-2 px-4 text-base font-bold transition-colors ${
              pathname === "/"
                ? "border-accent-green/60 bg-accent-green/10 text-accent-green"
                : "border-border text-foreground hover:border-accent-green/40"
            }`}
          >
            {mainNav.home.label}
          </Link>

          {mainNav.groups.map((group) => {
            const theme = NAV_ACCENT[group.accent];
            const expanded = openGroup === group.id;
            const panelId = `mobile-nav-${group.id}`;
            return (
              <div key={group.id} className="overflow-hidden rounded-xl border-2 border-border bg-background/40">
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => setOpenGroup(expanded ? null : group.id)}
                  className="flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left text-base font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-green"
                >
                  <span className="flex items-center gap-2.5">
                    <span aria-hidden className={`h-2.5 w-2.5 rounded-sm bg-gradient-to-br ${theme.bar}`} />
                    {group.label}
                    {activeGroup === group.id && <span className="rounded-full bg-accent-green/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-green">Here</span>}
                  </span>
                  <IconChevronDown className={`h-4 w-4 flex-none text-muted transition-transform ${expanded ? "rotate-180" : ""}`} />
                </button>
                {/* Always rendered (hidden when collapsed) so the links stay in the page HTML. */}
                <ul id={panelId} hidden={!expanded} className="flex flex-col gap-1 border-t border-border/70 p-2">
                  {group.items.map((item) => {
                    const active = item.href === pathname;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          className={`flex min-h-12 items-center gap-3 rounded-lg border-2 px-2.5 py-2 transition-colors ${
                            active ? theme.activeItem : `border-transparent ${theme.hoverItem}`
                          }`}
                        >
                          <span
                            aria-hidden
                            className={`flex h-9 w-11 flex-none items-center justify-center rounded-md border text-[11px] font-extrabold tracking-wide ${theme.badge}`}
                          >
                            {item.badge}
                          </span>
                          <span className="min-w-0">
                            <span className={`block text-sm font-semibold ${active ? theme.text : "text-foreground"}`}>{item.label}</span>
                            <span className="block text-xs text-muted">{item.hint}</span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
