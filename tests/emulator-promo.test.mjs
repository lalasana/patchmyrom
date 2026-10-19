// Guards for the GBA Emulator promotion: one Play URL, no leftover GBA Play branding, and the
// emulator is only ever offered for files it can play (never Nintendo DS).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  GBA_EMULATOR_URL,
  GBA_EMULATOR_TITLE,
  GBA_EMULATOR_SYSTEMS,
  isGameBoyFamilyFile,
} from "../lib/gba-emulator.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function sourceFiles(dir, out = []) {
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(rel, out);
    else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) out.push(rel.split(path.sep).join("/"));
  }
  return out;
}

const SITE_SOURCE = ["app", "components", "lib", "hooks"].flatMap((d) => sourceFiles(d));

test("promotion constants match the verified Google Play listing", () => {
  assert.equal(GBA_EMULATOR_URL, "https://play.google.com/store/apps/details?id=app.gbaemulator");
  assert.equal(GBA_EMULATOR_TITLE, "GBA Emulator: Play Retro Games");
  assert.deepEqual([...GBA_EMULATOR_SYSTEMS], ["GBA", "GBC", "GB"]);
});

test("emulator is offered only for .gba/.gbc/.gb outputs, never .nds or other systems", () => {
  for (const ok of ["game (patched).gba", "Hack.GBC", "a.gb", " b (patched).gba "]) assert.equal(isGameBoyFamilyFile(ok), true, ok);
  for (const no of ["game (patched).nds", "x.sfc", "x.nes", "x.z64", "x.gba.bak", "gba", "x.gbax", ""]) assert.equal(isGameBoyFamilyFile(no), false, no);
});

test("no GBA Play branding, old Play Store id or old asset paths remain in site source", () => {
  const offenders = [];
  for (const file of SITE_SOURCE) {
    const text = fs.readFileSync(path.join(ROOT, file), "utf8");
    // The legacy /gba-play route is the one allowed reference: it is the canonical/meta-refresh fallback.
    const body = file === "app/gba-play/page.tsx" ? text.replace(/LegacyGbaPlayRedirect/g, "") : text;
    if (/GBA Play|gbaplay|GBA_PLAY|com\.gbaplay|gba-play-/i.test(body)) offenders.push(file);
    if (file !== "app/gba-play/page.tsx" && /["'`(]\/gba-play/.test(body)) offenders.push(`${file} (links to old URL)`);
  }
  assert.deepEqual(offenders, []);
});

test("every Google Play URL in the source is the single emulator URL", () => {
  for (const file of SITE_SOURCE) {
    const text = fs.readFileSync(path.join(ROOT, file), "utf8");
    for (const m of text.matchAll(/https:\/\/play\.google\.com[^"'`\s)]*/g)) {
      assert.equal(m[0], GBA_EMULATOR_URL, `${file} contains ${m[0]}`);
    }
  }
});

test("old URL is permanently redirected for Cloudflare Pages", () => {
  const rules = fs.readFileSync(path.join(ROOT, "public/_redirects"), "utf8");
  assert.match(rules, /^\/gba-play\s+\/gba-emulator\/\s+301\s*$/m);
  assert.match(rules, /^\/gba-play\/\s+\/gba-emulator\/\s+301\s*$/m);
  const sitemap = fs.readFileSync(path.join(ROOT, "app/sitemap.ts"), "utf8");
  assert.match(sitemap, /\/gba-emulator/);
  assert.doesNotMatch(sitemap, /\/gba-play/);
});

test("copy never claims the emulator runs Nintendo DS games", () => {
  for (const file of SITE_SOURCE.filter((f) => /GbaEmulator|gba-emulator/.test(f))) {
    const text = fs.readFileSync(path.join(ROOT, file), "utf8");
    for (const m of text.matchAll(/[^.\n]*\b(Nintendo DS|NDS|\.nds|DS hacks|DS games)\b[^.\n]*/g)) {
      assert.match(m[0], /not supported|can.{1,8}t be played|can.{1,8}t play|does not support|only|not/i, `${file}: ${m[0].trim()}`);
    }
  }
});
