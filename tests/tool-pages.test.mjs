// Guards the nine console / patch-format pages: each one embeds the shared patcher through ToolPage,
// keeps its own canonical path, and no longer sends visitors to the home page to do the patching.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const SLUGS = [
  "gba-rom-patcher",
  "nds-rom-patcher",
  "gbc-rom-patcher",
  "nes-rom-patcher",
  "snes-rom-patcher",
  "ips-patcher",
  "ups-patcher",
  "bps-patcher",
  "xdelta-patcher",
];
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

for (const slug of SLUGS) {
  test(`/${slug}: embeds the patcher, self-canonical, no homepage call to action`, () => {
    const src = read(`app/${slug}/page.tsx`);
    assert.match(src, /<ToolPage/, "uses the shared ToolPage layout (which embeds RomPatcherTool)");
    assert.match(src, new RegExp(`path: "/${slug}"`), "metadata canonical path is its own");
    assert.match(src, new RegExp(`path="/${slug}"`), "breadcrumb path is its own");
    assert.match(src, /patcher=\{\{[\s\S]*?heading:/, "patcher has a page-specific heading");
    assert.doesNotMatch(src, /ButtonLink/, "no button sending the visitor elsewhere");
    assert.doesNotMatch(src, /Ready when you are|patcher below/i, "no stale 'patcher below' copy");
    assert.match(src, /\/rom-checksum-checker/, "links to the ROM Checksum Checker");
    assert.match(src, /\/patch-compatibility-checker/, "links to the Patch Compatibility Checker");
    assert.match(src, /<h1|title="/, "keeps a title for the H1");
  });
}

test("ToolPage places the patcher before any other content section", () => {
  const src = read("components/tool/ToolPage.tsx");
  const patcher = src.indexOf("<RomPatcherTool");
  assert.ok(patcher > 0);
  for (const marker of [">Before you patch<", "props.feature.title", "props.howTo.heading"]) {
    assert.ok(src.indexOf(marker) > patcher, `${marker} comes after the patcher`);
  }
});

test("format pages preselect their own format; console pages keep Auto-detect or IPS for NES", () => {
  const expected = { "ips-patcher": "IPS", "ups-patcher": "UPS", "bps-patcher": "BPS", "xdelta-patcher": "xdelta", "nes-rom-patcher": "IPS" };
  for (const [slug, format] of Object.entries(expected)) {
    assert.match(read(`app/${slug}/page.tsx`), new RegExp(`defaultFormat: "${format}"`), slug);
  }
  for (const slug of ["gba-rom-patcher", "nds-rom-patcher", "gbc-rom-patcher", "snes-rom-patcher"]) {
    assert.doesNotMatch(read(`app/${slug}/page.tsx`), /defaultFormat/, slug);
  }
});

test("each page carries its own identity: kicker, four facts, a diagram and its own hero art", () => {
  const accents = new Set();
  const consoles = { "gba-rom-patcher": "gba", "nds-rom-patcher": "nds", "gbc-rom-patcher": "gbc", "nes-rom-patcher": "nes", "snes-rom-patcher": "snes" };
  for (const slug of SLUGS) {
    const src = read(`app/${slug}/page.tsx`);
    assert.match(src, /kicker="/, `${slug}: kicker`);
    assert.equal((src.match(/\{ label: "[^"]+", value: "/g) || []).length, 4, `${slug}: four facts`);
    assert.match(src, /diagram=\{\{/, `${slug}: diagram`);
    if (consoles[slug]) assert.match(src, new RegExp(`platform="${consoles[slug]}"`), `${slug}: console silhouette`);
    else assert.match(src, /art="(ips|ups|bps|xdelta)"/, `${slug}: format art`);
    accents.add(src.match(/accent="([a-z]+)"/)[1]);
  }
  assert.ok(accents.size >= 5, "at least five distinct accents across the nine pages");
});

test("SEO-critical page metadata was not touched by the identity work", () => {
  // Titles, descriptions and H1s are asserted elsewhere / by the SEO diff; here: the H1 text stays the page name.
  for (const slug of SLUGS) {
    const src = read(`app/${slug}/page.tsx`);
    assert.match(src, /title="[A-Za-z ]+(Patcher)"/, `${slug}: H1 title kept`);
  }
});
