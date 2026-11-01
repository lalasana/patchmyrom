// SEO guard-rails for the ROM toolkit pages: indexable, unique, linked, and nothing existing lost.
// These read the source files (the pages are server components), so they run with plain `node --test`.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

const TOOL_PAGES = [
  { dir: "rom-checksum-checker", path: "/rom-checksum-checker" },
  { dir: "patch-compatibility-checker", path: "/patch-compatibility-checker" },
];

// Every URL in the sitemap before the toolkit was added. None may disappear.
const EXISTING_PATHS = [
  "",
  "/pokemon-rom-patcher",
  "/patch-formats",
  "/how-to-patch-pokemon-rom-hacks",
  "/troubleshooting",
  "/ips-patcher",
  "/bps-patcher",
  "/ups-patcher",
  "/xdelta-patcher",
  "/gba-rom-patcher",
  "/nds-rom-patcher",
  "/gbc-rom-patcher",
  "/nes-rom-patcher",
  "/snes-rom-patcher",
  "/gba-emulator",
  "/about",
  "/changelog",
  "/contact",
  "/privacy",
  "/terms",
  "/disclaimer",
  "/dmca",
];

function metadataOf(source) {
  const block = /buildPageMetadata\(\{([\s\S]*?)\}\);/.exec(source);
  if (!block) return null;
  const field = (name) => {
    const m = new RegExp(`${name}:\\s*\\n?\\s*"((?:[^"\\\\]|\\\\.)*)"`).exec(block[1]);
    return m ? m[1] : null;
  };
  let pagePath = field("path");
  if (pagePath === null && /path:\s*PATH/.test(block[1])) {
    const constant = /const PATH = "([^"]+)"/.exec(source);
    pagePath = constant ? constant[1] : null;
  }
  return { title: field("title"), description: field("description"), path: pagePath };
}

function allPageSources() {
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(rel);
      else if (entry.name === "page.tsx") out.push(rel);
    }
  };
  walk("app");
  return out;
}

describe("tool pages: metadata", () => {
  for (const page of TOOL_PAGES) {
    test(`${page.path}: title, description and canonical path are set and sized for search results`, () => {
      const meta = metadataOf(read(`app/${page.dir}/page.tsx`));
      assert.ok(meta, "uses buildPageMetadata (canonical + OpenGraph + Twitter)");
      assert.equal(meta.path, page.path);
      assert.ok(meta.title.length >= 25 && meta.title.length <= 70, `title length ${meta.title.length}`);
      assert.ok(meta.description.length >= 100 && meta.description.length <= 160, `description length ${meta.description.length}`);
    });
  }

  test("titles and descriptions are unique across every page (no near-duplicate tool pages)", () => {
    const seenTitles = new Map();
    const seenDescriptions = new Map();
    for (const rel of allPageSources()) {
      const meta = metadataOf(read(rel));
      if (!meta || !meta.title) continue;
      assert.ok(!seenTitles.has(meta.title), `${rel} repeats the title of ${seenTitles.get(meta.title)}`);
      seenTitles.set(meta.title, rel);
      if (meta.description) {
        assert.ok(!seenDescriptions.has(meta.description), `${rel} repeats the description of ${seenDescriptions.get(meta.description)}`);
        seenDescriptions.set(meta.description, rel);
      }
    }
    assert.ok(seenTitles.size >= 20);
  });
});

describe("tool pages: content and structured data", () => {
  for (const page of TOOL_PAGES) {
    const source = read(`app/${page.dir}/page.tsx`);

    test(`${page.path}: one h1, a FAQ (which emits FAQPage JSON-LD), breadcrumbs, and accurate WebApplication data`, () => {
      assert.equal((source.match(/<h1[ >]/g) || []).length, 1);
      assert.match(source, /<FaqAccordion items=\{faqItems\}/);
      assert.match(source, /<Breadcrumbs items=/);
      assert.match(source, /"@type": "WebApplication"/);
      assert.match(source, /isAccessibleForFree: true/);
      assert.match(source, /price: "0"/);
      assert.match(source, /featureList: \[/);
      // never an invented rating, review or price claim
      assert.doesNotMatch(source, /aggregateRating|review|ratingValue/i);
    });

    test(`${page.path}: has substantial, page-specific copy (not a thin tool shell)`, () => {
      const text = source.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
      assert.ok(text.length > 6000, `only ${text.length} characters of source copy`);
    });
  }

  test("the two tool pages do not share their FAQ questions", () => {
    const questions = (rel) => [...read(rel).matchAll(/question:\s*"([^"]+)"/g)].map((m) => m[1]);
    const a = questions("app/rom-checksum-checker/page.tsx");
    const b = questions("app/patch-compatibility-checker/page.tsx");
    assert.ok(a.length >= 5 && b.length >= 5);
    assert.deepEqual(a.filter((q) => b.includes(q)), []);
  });

  test("the compatibility page states, in its own copy, that IPS is never reported as compatible", () => {
    assert.match(read("app/patch-compatibility-checker/page.tsx"), /never label an IPS patch Compatible/);
  });

  test("no page copy, FAQ answer or llms.txt claims the tools work offline", () => {
    for (const rel of ["app/rom-checksum-checker/page.tsx", "app/patch-compatibility-checker/page.tsx", "app/llms.txt/route.ts"]) {
      assert.doesNotMatch(read(rel), /works? (?:\w+ )*offline|and offline|offline once/i, rel);
    }
    assert.match(read("app/rom-checksum-checker/page.tsx"), /not an offline tool/);
  });

  test("APS is described as partial evidence everywhere (never 'Compatible or Mismatch'), and the memory limits are device-dependent", () => {
    const page = read("app/patch-compatibility-checker/page.tsx");
    assert.doesNotMatch(page, /APS[^\n]*Compatible or Mismatch/);
    assert.match(page, /APS \(N64\)[^\n]*never Compatible/);
    assert.match(page, /APS \(GBA\)[^\n]*never Compatible/);
    assert.doesNotMatch(page, /Verifies UPS, BPS, RUP, APS and PMSR/);
    assert.match(page, /32 MB on devices with 2 GB or less/);
    assert.doesNotMatch(page, /limited to ROMs of up to 256 MB;/, "the memory note names the 256 MB ceiling only as the best case");
    const llms = read("app/llms.txt/route.ts");
    assert.doesNotMatch(llms, /UPS, BPS, RUP, APS and PMSR patches can be verified/);
    assert.match(llms, /APS patches store only part of the ROM/);
  });
});

describe("sitemap, llms.txt, links", () => {
  test("every pre-existing URL is still in the sitemap, and the two tools were added", () => {
    const sitemap = read("app/sitemap.ts");
    for (const p of EXISTING_PATHS) assert.ok(sitemap.includes(`path: "${p}"`), `sitemap lost ${p || "/"}`);
    for (const page of TOOL_PAGES) assert.ok(sitemap.includes(`path: "${page.path}"`), `sitemap is missing ${page.path}`);
  });

  test("sitemap entries are unique", () => {
    const paths = [...read("app/sitemap.ts").matchAll(/path: "([^"]*)"/g)].map((m) => m[1]);
    assert.equal(new Set(paths).size, paths.length);
  });

  test("llms.txt lists both tools", () => {
    const llms = read("app/llms.txt/route.ts");
    for (const page of TOOL_PAGES) assert.ok(llms.includes(`path: "${page.path}"`));
  });

  test("the footer links to both tools", () => {
    const site = read("lib/site.ts");
    for (const page of TOOL_PAGES) assert.ok(site.includes(`href: "${page.path}"`));
  });

  test("relevant existing pages link to the tools in context", () => {
    for (const rel of ["app/page.tsx", "app/troubleshooting/page.tsx", "app/snes-rom-patcher/page.tsx", "app/how-to-patch-pokemon-rom-hacks/page.tsx"]) {
      const source = read(rel);
      assert.ok(source.includes('href: "/patch-compatibility-checker"'), `${rel} should link to the compatibility checker`);
      assert.ok(source.includes('href: "/rom-checksum-checker"'), `${rel} should link to the checksum checker`);
    }
    // IPS / xdelta carry no checksum, which is exactly what the compatibility checker explains
    for (const rel of ["app/ips-patcher/page.tsx", "app/xdelta-patcher/page.tsx", "app/patch-formats/page.tsx"]) {
      assert.ok(read(rel).includes('href: "/patch-compatibility-checker"'), rel);
    }
  });

  test("the two tools link to each other and to the patcher", () => {
    const checksum = read("components/tools/RomChecksumTool.tsx") + read("app/rom-checksum-checker/page.tsx");
    const compat = read("components/tools/PatchCompatibilityTool.tsx") + read("app/patch-compatibility-checker/page.tsx");
    assert.match(checksum, /href="\/patch-compatibility-checker"|href: "\/patch-compatibility-checker"/);
    assert.match(compat, /href="\/rom-checksum-checker"|href: "\/rom-checksum-checker"/);
    assert.match(checksum, /href="\/"|href: "\/"/);
    assert.match(compat, /href="\/"|href: "\/"/);
  });
});
