// Guards the header navigation: structure requested for the redesign, every link resolves to a real
// page, legal pages stay in the footer, and the menus keep their accessibility hooks.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { mainNav, footerLinks, patchFormatPages, consolePatcherPages } from "../lib/site.ts";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const pageExists = (href) => (href === "/" ? existsSync(new URL("../app/page.tsx", import.meta.url)) : existsSync(new URL(`../app${href}/page.tsx`, import.meta.url)));

test("header menu has the agreed groups, in order", () => {
  assert.equal(mainNav.home.href, "/");
  assert.deepEqual(mainNav.groups.map((g) => g.label), ["Consoles", "Patch Formats", "Tools", "Guides"]);
  const hrefs = (id) => mainNav.groups.find((g) => g.id === id).items.map((i) => i.href);
  assert.deepEqual(hrefs("consoles"), ["/gba-rom-patcher", "/nds-rom-patcher", "/gbc-rom-patcher", "/nes-rom-patcher", "/snes-rom-patcher"]);
  assert.deepEqual(hrefs("formats"), ["/ips-patcher", "/ups-patcher", "/bps-patcher", "/xdelta-patcher"]);
  assert.deepEqual(hrefs("tools"), ["/rom-checksum-checker", "/patch-compatibility-checker", "/pokemon-rom-patcher"]);
  assert.deepEqual(hrefs("guides"), ["/how-to-patch-pokemon-rom-hacks", "/patch-formats", "/troubleshooting"]);
});

test("every header link points at a real page, with no duplicates", () => {
  const all = [mainNav.home.href, ...mainNav.groups.flatMap((g) => g.items.map((i) => i.href))];
  assert.equal(new Set(all).size, all.length, "no duplicate links");
  for (const href of all) assert.ok(pageExists(href), `${href} has a page`);
  for (const g of mainNav.groups) for (const i of g.items) assert.ok(i.label && i.hint && i.badge, `${i.href} has label, hint and badge`);
});

test("the header menus and the shared page lists stay in sync", () => {
  const consoles = mainNav.groups.find((g) => g.id === "consoles").items.map((i) => i.href);
  const formats = mainNav.groups.find((g) => g.id === "formats").items.map((i) => i.href);
  assert.deepEqual(consoles.sort(), consolePatcherPages.map((p) => p.href).sort());
  assert.deepEqual(formats.sort(), patchFormatPages.map((p) => p.href).sort());
});

test("legal and secondary pages live in the footer, not the header", () => {
  const header = new Set([mainNav.home.href, ...mainNav.groups.flatMap((g) => g.items.map((i) => i.href))]);
  for (const href of ["/about", "/privacy", "/terms", "/disclaimer", "/dmca", "/contact"]) {
    assert.ok(!header.has(href), `${href} not in header`);
    assert.ok(footerLinks.legal.some((l) => l.href === href), `${href} in footer`);
  }
  assert.ok(footerLinks.guides.some((l) => l.href === "/changelog"));
});

test("menus keep their accessibility hooks", () => {
  const desktop = read("components/layout/HeaderNavLinks.tsx");
  const mobile = read("components/layout/MobileMenu.tsx");
  for (const [name, src] of [["desktop", desktop], ["mobile", mobile]]) {
    assert.match(src, /aria-expanded/, `${name}: aria-expanded`);
    assert.match(src, /aria-controls/, `${name}: aria-controls`);
    assert.match(src, /aria-current=\{[^}]*"page"/, `${name}: aria-current for the active page`);
    assert.match(src, /Escape/, `${name}: Escape closes`);
    assert.match(src, /hidden=\{/, `${name}: links stay in the HTML while collapsed`);
  }
  assert.match(desktop, /ArrowDown/);
  assert.match(desktop, /normalizePath/, "active page is compared without the trailing slash");
});
