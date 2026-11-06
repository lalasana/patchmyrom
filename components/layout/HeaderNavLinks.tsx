"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { mainNav, type NavGroup } from "@/lib/site";
import { IconChevronDown } from "@/components/ui/icons";
import { NAV_ACCENT, normalizePath } from "@/components/layout/nav-theme";

const HOVER_CLOSE_DELAY_MS = 140;

/**
 * Desktop navigation: the general patcher link plus four dropdowns.
 * Disclosure pattern: each group is a button that shows a list of ordinary links.
 *  - mouse: opens on hover, click pins it open
 *  - touch / click: toggles
 *  - keyboard: Enter/Space/ArrowDown open (ArrowDown focuses the first link), arrows/Home/End move,
 *    Escape closes and returns focus to the button, Tab out closes
 */
export default function HeaderNavLinks() {
  const pathname = normalizePath(usePathname());
  // Open state is tied to the path it was opened on, so navigating closes the menu without an effect.
  const [open, setOpen] = useState<{ id: NavGroup["id"]; pinned: boolean; path: string } | null>(null);
  const openId = open && open.path === pathname ? open.id : null;
  const pinned = openId !== null && open?.pinned === true;
  const setOpenId = (id: NavGroup["id"] | null) => setOpen(id ? { id, pinned: false, path: pathname } : null);
  const setPinned = (value: boolean) => setOpen((prev) => (prev ? { ...prev, pinned: value } : prev));
  const rootRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const close = useCallback(() => {
    cancelClose();
    setOpen(null);
  }, []);

  // Close on outside pointer press.
  useEffect(() => {
    if (!openId) return;
    const onDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) close();
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [openId, close]);

  useEffect(() => () => cancelClose(), []);

  const focusItem = (groupId: string, index: number | "first" | "last") => {
    const links = rootRef.current?.querySelectorAll<HTMLAnchorElement>(`[data-nav-panel="${groupId}"] a`);
    if (!links || links.length === 0) return;
    const i = index === "first" ? 0 : index === "last" ? links.length - 1 : Math.max(0, Math.min(links.length - 1, index));
    links[i].focus();
  };

  return (
    <nav ref={rootRef} aria-label="Main" className="hidden items-center gap-1 lg:flex">
      <Link
        href={mainNav.home.href}
        aria-current={pathname === "/" ? "page" : undefined}
        className={`rounded-md border-2 px-3.5 py-1.5 text-base font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green ${
          pathname === "/"
            ? "border-accent-green/60 bg-accent-green/10 text-accent-green shadow-[0_3px_0_0_rgba(0,0,0,0.35)]"
            : "border-transparent text-muted hover:-translate-y-0.5 hover:border-border hover:bg-card hover:text-foreground"
        }`}
      >
        {mainNav.home.label}
      </Link>

      {mainNav.groups.map((group, groupIndex) => {
        const theme = NAV_ACCENT[group.accent];
        const isOpen = openId === group.id;
        const hasActive = group.items.some((item) => item.href === pathname);
        const alignRight = groupIndex >= 2;
        const panelId = `nav-panel-${group.id}`;
        return (
          <div
            key={group.id}
            className="relative"
            onPointerEnter={(event) => {
              if (event.pointerType !== "mouse") return;
              cancelClose();
              setOpenId(group.id);
              setPinned(false);
            }}
            onPointerLeave={(event) => {
              if (event.pointerType !== "mouse" || pinned) return;
              cancelClose();
              closeTimer.current = setTimeout(close, HOVER_CLOSE_DELAY_MS);
            }}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                if (openId === group.id) close();
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape" && isOpen) {
                event.stopPropagation();
                close();
                event.currentTarget.querySelector<HTMLButtonElement>("button")?.focus();
              }
            }}
          >
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => {
                if (isOpen && pinned) close();
                else {
                  cancelClose();
                  setOpenId(group.id);
                  setPinned(true);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  cancelClose();
                  setOpenId(group.id);
                  setPinned(true);
                  requestAnimationFrame(() => focusItem(group.id, "first"));
                }
              }}
              className={`flex items-center gap-1.5 rounded-md border-2 px-3.5 py-1.5 text-base font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green ${
                hasActive
                  ? `border-accent-green/60 bg-accent-green/10 text-accent-green shadow-[0_3px_0_0_rgba(0,0,0,0.35)]`
                  : isOpen
                    ? "border-border bg-card text-foreground"
                    : "border-transparent text-muted hover:-translate-y-0.5 hover:border-border hover:bg-card hover:text-foreground"
              }`}
            >
              {group.label}
              <IconChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Always rendered (hidden when closed) so the links stay in the page HTML for crawlers. */}
            {(
              <div
                id={panelId}
                data-nav-panel={group.id}
                hidden={!isOpen}
                className={`absolute top-full z-50 pt-2 ${alignRight ? "right-0" : "left-0"}`}
              >
                <div className="w-[21rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border-2 border-border bg-card shadow-[0_18px_40px_-12px_rgba(0,0,0,0.9)]">
                  <div aria-hidden className={`h-1 w-full bg-gradient-to-r ${theme.bar}`} />
                  <ul className="flex flex-col gap-1 p-2">
                    {group.items.map((item, itemIndex) => {
                      const active = item.href === pathname;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            aria-current={active ? "page" : undefined}
                            onKeyDown={(event) => {
                              if (event.key === "ArrowDown") {
                                event.preventDefault();
                                focusItem(group.id, itemIndex + 1);
                              } else if (event.key === "ArrowUp") {
                                event.preventDefault();
                                if (itemIndex === 0) {
                                  event.currentTarget.closest("[data-nav-panel]")?.parentElement?.querySelector<HTMLButtonElement>("button")?.focus();
                                } else focusItem(group.id, itemIndex - 1);
                              } else if (event.key === "Home") {
                                event.preventDefault();
                                focusItem(group.id, "first");
                              } else if (event.key === "End") {
                                event.preventDefault();
                                focusItem(group.id, "last");
                              }
                            }}
                            className={`flex items-center gap-3 rounded-lg border-2 px-2.5 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green ${
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
                              <span className={`block truncate text-sm font-semibold ${active ? theme.text : "text-foreground"}`}>
                                {item.label}
                              </span>
                              <span className="block truncate text-xs text-muted">{item.hint}</span>
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
