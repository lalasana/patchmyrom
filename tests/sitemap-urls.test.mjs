// The site is exported with trailing slashes ("/x" only 308-redirects to "/x/"), so the sitemap must list
// the canonical, slashed URLs. When a build exists (out/), also check every <loc> against the real pages.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);

test("sitemap.ts builds its URLs with a trailing slash", () => {
  const src = readFileSync(new URL("app/sitemap.ts", root), "utf8");
  assert.match(src, /url: `\$\{siteConfig\.url\}\$\{route\.path\}\/`/);
  assert.equal(/trailingSlash:\s*true/.test(readFileSync(new URL("next.config.ts", root), "utf8")), true, "site really uses trailing slashes");
  // route paths themselves stay slash-less, so the home page is "" and becomes the bare origin + "/"
  for (const m of src.matchAll(/path: "([^"]*)"/g)) assert.doesNotMatch(m[1], /\/$/, `route ${m[1]} must not end with a slash`);
});

test("built sitemap: every <loc> ends with a slash and matches that page's own canonical", { skip: !existsSync(new URL("out/sitemap.xml", root)) }, () => {
  const xml = readFileSync(new URL("out/sitemap.xml", root), "utf8");
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(locs.length >= 24, `expected at least 24 URLs, got ${locs.length}`);
  assert.equal(new Set(locs).size, locs.length, "no duplicate URLs");
  for (const loc of locs) {
    assert.ok(loc.endsWith("/"), `${loc} ends with a slash`);
    const pathname = new URL(loc).pathname;
    const file = new URL(`out${pathname}index.html`, root);
    assert.ok(existsSync(file), `${loc} has a page in the export`);
    const canonical = readFileSync(file, "utf8").match(/<link rel="canonical" href="([^"]*)"/)?.[1];
    assert.equal(canonical, loc, `${loc} is its own canonical`);
  }
});

test("breadcrumb JSON-LD, llms.txt and in-page links use canonical trailing-slash URLs", () => {
  const crumbs = readFileSync(new URL("components/ui/Breadcrumbs.tsx", root), "utf8");
  assert.ok(crumbs.includes('item.href === "/" ? "/" : item.href.replace('), "breadcrumb item URLs are normalised to a trailing slash");
  const llms = readFileSync(new URL("app/llms.txt/route.ts", root), "utf8");
  assert.ok(llms.includes('entry.path.endsWith("/") ? entry.path'), "llms.txt links are normalised to a trailing slash");
  assert.doesNotMatch(readFileSync(new URL("app/contact/page.tsx", root), "utf8"), /href="\/dmca"/);
});
