// Worker cache versioning (scripts/worker-bundle.mjs) and the human-readable out-of-memory size.
//
// The bundle tests build into temp directories and never touch public/worker-bundle, so they are
// independent of whether a `next build` has run. The behaviour tests drive the GENERATED workers
// through the same vm harness and the same real fixtures as the rest of the suite.
import { test, describe, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { buildWorkerBundle, parseImports, unversionedWorkerUrls, ENTRY_WORKERS, BUNDLE_URL_PREFIX } from "../scripts/worker-bundle.mjs";
import { createWorker, fakeFile } from "./helpers/worker-harness.mjs";
import * as fx from "./helpers/fixtures.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const V = createRequire(import.meta.url)("../public/workers/vcdiff-secondary.js");
const OPTIONS = { requireValidation: true, removeHeader: true, fixChecksum: true, outputSuffix: true };

const scratch = [];
function tmpDir(label) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `pmr-${label}-`));
  scratch.push(dir);
  return dir;
}
after(() => {
  for (const dir of scratch) fs.rmSync(dir, { recursive: true, force: true });
});

/** A throwaway project root holding copies of public/workers and public/vendor (optionally CRLF). */
function copyProject({ crlf = false } = {}) {
  const root = tmpDir("root");
  for (const sub of ["workers", "vendor"]) {
    fs.cpSync(path.join(ROOT, "public", sub), path.join(root, "public", sub), { recursive: true });
  }
  if (crlf) {
    const walk = (dir) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (p.endsWith(".js")) fs.writeFileSync(p, fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n").replace(/\n/g, "\r\n"));
      }
    };
    walk(path.join(root, "public"));
  }
  return root;
}

const sha = (text) => crypto.createHash("sha256").update(text, "utf8").digest("hex").slice(0, 12);
const names = (result) => result.files;
const baseOf = (name) => name.replace(/\.[0-9a-f]{12}\.js$/, "");
const byBase = (result) => Object.fromEntries(result.files.map((f) => [baseOf(f), f]));
const entryFile = (result, key) => result.urls[key].slice(BUNDLE_URL_PREFIX.length);

function build(root) {
  return buildWorkerBundle({ rootDir: root, outDir: path.join(tmpDir("out"), "public", "worker-bundle") });
}
const read = (result, name) => fs.readFileSync(path.join(result.outDir, name), "utf8");
const edit = (root, rel, fn) => {
  const file = path.join(root, "public", ...rel.split("/"));
  fs.writeFileSync(file, fn(fs.readFileSync(file, "utf8")));
};

// -------------------------------------------------------------------------------------------------
describe("worker bundle: names are bound to content", () => {
  const result = build(ROOT);

  test("every emitted file is named after the SHA-256 of its own content", () => {
    assert.ok(names(result).length >= 17);
    for (const name of names(result)) {
      const m = /\.([0-9a-f]{12})\.js$/.exec(name);
      assert.ok(m, `${name} has no content hash`);
      assert.equal(m[1], sha(read(result, name)), `${name} does not match its content`);
    }
  });

  test("entry URLs are the hashed files under /worker-bundle/, one per entry worker", () => {
    assert.deepEqual(Object.keys(result.urls).sort(), ENTRY_WORKERS.map((w) => w.key).sort());
    for (const url of Object.values(result.urls)) {
      assert.match(url, /^\/worker-bundle\/[A-Za-z0-9._-]+\.[0-9a-f]{12}\.js$/);
      assert.ok(fs.existsSync(path.join(result.outDir, url.slice(BUNDLE_URL_PREFIX.length))));
    }
    assert.match(result.urls.romPatcher, /rom-patcher-worker\./);
    assert.match(result.urls.analysis, /analysis-worker\./);
  });

  test("every importScripts() dependency of every entry is a hashed file that exists; no unversioned URL is left", () => {
    for (const key of Object.keys(result.urls)) {
      const text = read(result, entryFile(result, key));
      const { urls } = parseImports(text, key);
      // the patcher and analysis workers share 15 files; the ROM-toolkit workers list their own sets
      const expected = { romPatcher: 15, analysis: 15, hash: 2, compat: 17 };
      assert.equal(urls.length, expected[key], `the dependency list of ${key} must be unchanged in length`);
      for (const url of urls) {
        assert.ok(url.startsWith(BUNDLE_URL_PREFIX), `${url} is not versioned`);
        assert.ok(names(result).includes(url.slice(BUNDLE_URL_PREFIX.length)), `${url} was not emitted`);
      }
      assert.doesNotMatch(text, /"\/(?:workers|vendor)\//, "an unversioned /workers or /vendor URL survived");
    }
  });

  test("dependencies are byte-identical to their sources; the entry differs only in its importScripts() list", () => {
    const src = (rel) => fs.readFileSync(path.join(ROOT, "public", rel), "utf8").replace(/\r\n/g, "\n");
    const files = byBase(result);
    assert.equal(read(result, files["patch-compat"]), src("workers/patch-compat.js"));
    assert.equal(read(result, files["vcdiff-secondary"]), src("workers/vcdiff-secondary.js"));
    assert.equal(read(result, files["RomPatcher.format.bps"]), src("vendor/rom-patcher-js/modules/RomPatcher.format.bps.js"));
    for (const w of ENTRY_WORKERS) {
      const original = src(w.source);
      const generated = read(result, entryFile(result, w.key));
      const strip = (s) => s.replace(/self\.importScripts\([^)]*\);/, "");
      assert.equal(strip(generated), strip(original));
    }
  });

  test("the patcher and analysis workers share one set of hashed dependencies (each file is downloaded once)", () => {
    const deps = (key) => parseImports(read(result, entryFile(result, key)), key).urls;
    assert.deepEqual(deps("romPatcher"), deps("analysis"));
    // 15 shared files + stream-hash.js and rom-toolkit.js (ROM toolkit) + one file per entry worker (4)
    assert.equal(names(result).length, 15 + 2 + 4);
    // the ROM-toolkit workers reuse those same hashed files rather than carrying copies
    const shared = new Set(deps("romPatcher"));
    const compat = deps("compat").filter((u) => shared.has(u));
    assert.equal(compat.length, 15, "the compatibility worker reuses every shared file instead of carrying its own copies");
  });

  test("the unversioned fallback points at the plain sources (used by `next dev`)", () => {
    assert.deepEqual(unversionedWorkerUrls(), {
      romPatcher: "/workers/rom-patcher-worker.js",
      analysis: "/workers/analysis-worker.js",
      hash: "/workers/hash-worker.js",
      compat: "/workers/compat-worker.js",
    });
  });
});

// -------------------------------------------------------------------------------------------------
describe("worker bundle: versioning behaviour", () => {
  test("deterministic: the same sources always produce the same names and bytes", () => {
    const a = build(ROOT);
    const b = build(ROOT);
    assert.deepEqual(a.urls, b.urls);
    assert.deepEqual(names(a), names(b));
    for (const n of names(a)) assert.equal(read(a, n), read(b, n));
  });

  test("independent of line endings: a CRLF checkout (Windows autocrlf) yields the same names and bytes", () => {
    const lf = build(copyProject());
    const crlf = build(copyProject({ crlf: true }));
    assert.deepEqual(lf.urls, crlf.urls);
    assert.deepEqual(names(lf), names(crlf));
    for (const n of names(lf)) assert.equal(read(lf, n), read(crlf, n));
  });

  test("changing one vendored decoder re-versions it AND every worker that pins it; nothing else", () => {
    const root = copyProject();
    const before = build(root);
    edit(root, "vendor/rom-patcher-js/modules/RomPatcher.format.bps.js", (s) => s + "\n// changed\n");
    const after2 = build(root);
    const b = byBase(before);
    const a = byBase(after2);
    const changed = Object.keys(b).filter((k) => b[k] !== a[k]).sort();
    assert.deepEqual(changed, ["RomPatcher.format.bps", "analysis-worker", "compat-worker", "rom-patcher-worker"]);
    assert.notEqual(before.urls.romPatcher, after2.urls.romPatcher);
    assert.notEqual(before.urls.analysis, after2.urls.analysis);
  });

  test("changing the shared xdelta helper re-versions every worker that uses it (no worker can run a mixed set)", () => {
    const root = copyProject();
    const before = build(root);
    edit(root, "workers/vcdiff-secondary.js", (s) => s + "\n// changed\n");
    const after2 = build(root);
    const b = byBase(before);
    const a = byBase(after2);
    const changed = Object.keys(b).filter((k) => b[k] !== a[k]).sort();
    assert.deepEqual(changed, ["analysis-worker", "compat-worker", "rom-patcher-worker", "vcdiff-secondary"]);
  });

  test("changing only the analysis worker leaves the patch worker and every decoder URL unchanged (cache is kept)", () => {
    const root = copyProject();
    const before = build(root);
    edit(root, "workers/analysis-worker.js", (s) => s + "\n// changed\n");
    const after2 = build(root);
    assert.equal(before.urls.romPatcher, after2.urls.romPatcher);
    assert.notEqual(before.urls.analysis, after2.urls.analysis);
    const b = byBase(before);
    const a = byBase(after2);
    assert.deepEqual(Object.keys(b).filter((k) => b[k] !== a[k]), ["analysis-worker"]);
  });

  test("rebuilding into the same directory removes superseded files, keeps current ones, and leaves unknown files alone", () => {
    const root = copyProject();
    const outDir = path.join(tmpDir("out"), "public", "worker-bundle");
    const first = buildWorkerBundle({ rootDir: root, outDir });
    fs.writeFileSync(path.join(outDir, "notes.txt"), "keep me");
    edit(root, "vendor/rom-patcher-js/modules/RomPatcher.format.ips.js", (s) => s + "\n// changed\n");
    const second = buildWorkerBundle({ rootDir: root, outDir });
    const onDisk = fs.readdirSync(outDir).filter((n) => n !== "notes.txt").sort();
    assert.deepEqual(onDisk, names(second));
    assert.equal(names(second).length, names(first).length);
    assert.ok(!onDisk.includes(byBase(first)["RomPatcher.format.ips"]), "the superseded IPS decoder was not removed");
    assert.equal(fs.readFileSync(path.join(outDir, "notes.txt"), "utf8"), "keep me");
    assert.deepEqual(fs.readdirSync(outDir).filter((n) => n.endsWith(".tmp")), [], "temporary files were left behind");
  });

  test("building twice in a row (e.g. two Next.js processes loading the config) is a no-op the second time", () => {
    const root = copyProject();
    const outDir = path.join(tmpDir("out"), "public", "worker-bundle");
    buildWorkerBundle({ rootDir: root, outDir });
    const stamp = (n) => fs.statSync(path.join(outDir, n)).mtimeMs;
    const times = Object.fromEntries(fs.readdirSync(outDir).map((n) => [n, stamp(n)]));
    buildWorkerBundle({ rootDir: root, outDir });
    for (const n of Object.keys(times)) assert.equal(stamp(n), times[n], `${n} was rewritten`);
  });
});

// -------------------------------------------------------------------------------------------------
describe("worker bundle: refuses anything it cannot version safely", () => {
  test("a dependency that loads more scripts itself", () => {
    const root = copyProject();
    edit(root, "workers/patch-compat.js", (s) => s + '\nself.importScripts("/vendor/rom-patcher-js/RomPatcher.js");\n');
    assert.throws(() => build(root), /loads further scripts/);
  });

  test("importScripts() with anything but plain string literals", () => {
    const root = copyProject();
    edit(root, "workers/rom-patcher-worker.js", (s) => s.replace('"/workers/patch-compat.js"', '"/workers/" + "patch-compat.js"'));
    assert.throws(() => build(root), /plain string literals/);
  });

  test("a second importScripts() call, or a query string / relative URL", () => {
    assert.throws(() => parseImports("var a = 1;", "x"), /exactly one/);
    assert.throws(() => parseImports('self.importScripts("/a.js"); self.importScripts("/b.js");', "x"), /exactly one/);
    assert.throws(() => parseImports('self.importScripts("/a.js?v=1");', "x"), /absolute \.js path/);
    assert.throws(() => parseImports('self.importScripts("a.js");', "x"), /absolute \.js path/);
    assert.throws(() => parseImports('self.importScripts("/a.js", "/a.js");', "x"), /twice/);
  });

  test("a missing dependency fails the build instead of shipping a broken worker", () => {
    const root = copyProject();
    fs.rmSync(path.join(root, "public", "vendor", "rom-patcher-js", "modules", "BinFile.js"));
    assert.throws(() => build(root), /ENOENT/);
  });
});

// -------------------------------------------------------------------------------------------------
describe("worker bundle: the generated workers patch exactly like the source workers", () => {
  const bundle = build(ROOT);
  const publicDir = path.dirname(bundle.outDir); // <tmp>/public (contains worker-bundle/)
  const hashedPatcher = () => createWorker(null, { publicDir, workerPath: path.join(bundle.outDir, entryFile(bundle, "romPatcher")) });
  const hashedAnalysis = () => createWorker(null, { publicDir, workerPath: path.join(bundle.outDir, entryFile(bundle, "analysis")) });
  const sourcePatcher = () => createWorker("rom-patcher-worker.js");

  const SRC = fx.makeSyntheticGba(0x10000, 1);
  const DST = fx.applyEdits(SRC, fx.DEFAULT_EDITS);
  const message = (rom, patch, patchName) => ({
    type: "patch",
    romFile: fakeFile(rom, "game.gba"),
    patchFile: fakeFile(patch, patchName),
    options: OPTIONS,
    romCrc32: null,
  });
  const out = (r) => Buffer.from(r.patchedRomU8Array.buffer, r.patchedRomU8Array.byteOffset, r.patchedRomU8Array.byteLength);

  const cases = [
    ["BPS", "hack.bps", () => fx.buildBps(SRC, DST)],
    ["UPS", "hack.ups", () => fx.buildUps(SRC, DST)],
    ["IPS", "hack.ips", () => fx.buildIps(fx.DEFAULT_EDITS)],
  ];
  for (const [label, name, make] of cases) {
    test(`${label}: same successful, byte-exact result as the source worker`, async () => {
      const viaBundle = await hashedPatcher().run(message(SRC, make(), name));
      const viaSource = await sourcePatcher().run(message(SRC, make(), name));
      assert.equal(viaBundle.type, "success", viaBundle.message);
      assert.equal(viaSource.type, "success", viaSource.message);
      assert.deepEqual(out(viaBundle), out(viaSource));
      assert.deepEqual(out(viaBundle), Buffer.from(DST));
      assert.equal(viaBundle.outputVerified, viaSource.outputVerified);
      assert.equal(viaBundle.fileName, viaSource.fileName);
    });
  }

  test("XDelta with LZMA secondary compression (VcdiffSecondary pre-pass) works through the hashed bundle", async () => {
    const read = (...p) => new Uint8Array(fs.readFileSync(path.join(HERE, "fixtures", "xdelta", ...p)));
    const src = read("src.bin");
    const tgt = Buffer.from(read("tgt.bin"));
    const msg = { type: "patch", romFile: fakeFile(src, "game.nds"), patchFile: fakeFile(read("lzma.xd"), "p.xdelta"), options: OPTIONS, romCrc32: null };
    const viaBundle = await hashedPatcher().run(msg);
    assert.equal(viaBundle.type, "success", viaBundle.message);
    assert.deepEqual(out(viaBundle), tgt);
    assert.equal(viaBundle.verification?.status ?? viaBundle.verification, (await sourcePatcher().run(msg)).verification?.status ?? viaBundle.verification);
  });

  test("a wrong ROM is still refused through the hashed bundle", async () => {
    const wrong = fx.makeSyntheticGba(0x10000, 2);
    const r = await hashedPatcher().run(message(wrong, fx.buildBps(SRC, DST), "hack.bps"));
    assert.equal(r.type, "error");
    assert.equal(r.patchedRomU8Array, undefined);
  });

  test("the analysis worker analyses ROMs and patches through the hashed bundle", async () => {
    const rom = (await hashedAnalysis().run({ type: "analyze-rom", requestId: "1", cacheKey: "a", file: fakeFile(SRC, "game.gba") })).data;
    assert.equal(rom.crc32, fx.hex8(fx.crc32(SRC)));
    assert.equal(rom.platform, "Game Boy Advance");
    const patch = (await hashedAnalysis().run({ type: "analyze-patch", requestId: "2", cacheKey: "b", file: fakeFile(fx.buildBps(SRC, DST), "hack.bps") })).data;
    assert.equal(patch.format, "BPS");
  });
});

// -------------------------------------------------------------------------------------------------
describe("out-of-memory message shows a human-readable size", () => {
  test("formatBytes uses B / KB / MB like lib/format-bytes.ts", () => {
    const cases = [
      [0, "0 B"],
      [1, "1 B"],
      [512, "512 B"],
      [1023, "1023 B"],
      [1024, "1.0 KB"],
      [1536, "1.5 KB"],
      [300000, "293.0 KB"],
      [1048575, "1024.0 KB"],
      [1048576, "1.0 MB"],
      [20 * 1048576, "20.0 MB"],
      [43.6 * 1048576, "43.6 MB"],
      [1073741824, "1024.0 MB"],
    ];
    for (const [bytes, text] of cases) assert.equal(V.formatBytes(bytes), text, `formatBytes(${bytes})`);
  });

  test("formatBytes is total: junk input never yields NaN or a negative size", () => {
    for (const junk of [NaN, -5, Infinity, undefined, null, "abc"]) assert.equal(V.formatBytes(junk), "0 B");
  });

  test('a small allocation no longer reads "0 MB"', () => {
    for (const bytes of [0, 100, 4096, 300000, 400000]) {
      const e = V.outOfMemoryError(bytes);
      assert.equal(e.code, "out-of-memory");
      assert.doesNotMatch(e.message, /\b0 MB\b/, `${bytes} bytes -> ${e.message}`);
      assert.match(e.message, new RegExp(`allocate the ${V.formatBytes(bytes).replace(".", "\\.")} this patch needs`));
      assert.match(e.message, /Close other tabs/);
    }
    assert.match(V.outOfMemoryError(300000).message, /allocate the 293\.0 KB this patch needs/);
    assert.match(V.outOfMemoryError(20 * 1048576).message, /allocate the 20\.0 MB this patch needs/);
  });

  test("a real failed allocation while decoding a small patch reports its true size", () => {
    const RealU8 = globalThis.Uint8Array;
    globalThis.Uint8Array = class extends RealU8 {
      constructor(a, ...rest) {
        if (typeof a === "number" && a > 5000) throw new RangeError("Array buffer allocation failed");
        super(a, ...rest);
      }
    };
    try {
      const patch = new RealU8(fs.readFileSync(path.join(HERE, "fixtures", "xdelta", "lzma.xd")));
      assert.throws(
        () => V.prepare(patch),
        (e) => e.code === "out-of-memory" && /allocate the \d+(\.\d)? (B|KB|MB) this patch needs/.test(e.message) && !/\b0 MB\b/.test(e.message)
      );
    } finally {
      globalThis.Uint8Array = RealU8;
    }
  });
});
