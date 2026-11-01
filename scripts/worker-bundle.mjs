// Content-hashed copies of the Web Workers and everything they importScripts().
//
// Why this exists. Cloudflare Pages serves unhashed static files with
// `Cache-Control: public, max-age=14400, must-revalidate`, so after a deploy a browser may keep using
// a cached worker (or cached decoder) for up to four hours while the page itself is already new —
// and a worker combined with a decoder from another release can silently misbehave. Changing the
// URL whenever the content changes removes that class of problem: a URL either serves exactly the
// bytes it was named after, or does not exist (a loud failure, never a quiet mix).
//
// How. The sources stay where they are (public/workers, public/vendor — the vendored library remains
// unmodified, and the Node tests keep running the real source files). At build time every dependency
// of an entry worker is copied to public/worker-bundle/<name>.<sha256-prefix>.js. The entry worker is
// then rewritten so its importScripts() lists those hashed URLs, and is itself named after the hash
// of the rewritten content. Because the entry embeds its dependencies' hashed URLs, its own name
// changes whenever ANY dependency changes (a Merkle tree): one URL pins a complete, consistent set.
// Unchanged files keep their names, so browsers keep serving them from cache after a deploy.
//
// The entry URLs reach the app through next.config.ts (`env`) and lib/worker-urls.ts. Generation
// happens when next.config.ts is loaded, so it runs however the build is invoked (`next build`,
// `npm run build`, `npx next build` on Cloudflare). Offline/client-side processing is unaffected: the
// workers are still plain static files, fetched from the same origin.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

export const BUNDLE_DIR_NAME = "worker-bundle";
export const BUNDLE_URL_PREFIX = `/${BUNDLE_DIR_NAME}/`;

/** The scripts the app starts with `new Worker(...)`. Keys are the names used by lib/worker-urls.ts. */
export const ENTRY_WORKERS = [
  { key: "romPatcher", source: "workers/rom-patcher-worker.js" },
  { key: "analysis", source: "workers/analysis-worker.js" },
  // ROM toolkit (checksum checker, compatibility checker)
  { key: "hash", source: "workers/hash-worker.js" },
  { key: "compat", source: "workers/compat-worker.js" },
];

const HASH_LENGTH = 12; // hex chars of SHA-256 (48 bits): plenty to tell versions of a handful of files apart
const HASHED_NAME = new RegExp(`\\.[0-9a-f]{${HASH_LENGTH}}\\.js$`);
const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** URLs of the original, unhashed workers — used by `next dev`, where nothing is cached long-term. */
export function unversionedWorkerUrls() {
  return Object.fromEntries(ENTRY_WORKERS.map((w) => [w.key, `/${w.source}`]));
}

// Git on Windows may check text files out with CRLF (core.autocrlf); hashing and emitting LF keeps
// a file's name — and bytes — identical on every machine, including the Linux build on Cloudflare.
const readNormalized = (file) => fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");

const contentHash = (text) => crypto.createHash("sha256").update(text, "utf8").digest("hex").slice(0, HASH_LENGTH);

const IMPORT_BLOCK = /self\.importScripts\(([^)]*)\)\s*;/g;

/** Finds the entry worker's single `self.importScripts("…", "…");` call and returns its URLs. */
export function parseImports(source, label) {
  const blocks = [...source.matchAll(IMPORT_BLOCK)];
  if (blocks.length !== 1) {
    throw new Error(`${label}: expected exactly one self.importScripts(...) call, found ${blocks.length}`);
  }
  const body = blocks[0][1];
  if (body.replace(/"[^"\n]*"|,|\s/g, "") !== "") {
    throw new Error(`${label}: importScripts() may only list plain string literals so it can be versioned`);
  }
  const urls = [...body.matchAll(/"([^"\n]*)"/g)].map((m) => m[1]);
  for (const url of urls) {
    if (!url.startsWith("/") || !url.endsWith(".js") || url.includes("..") || url.includes("?")) {
      throw new Error(`${label}: unsupported importScripts URL ${JSON.stringify(url)} (need an absolute .js path without query)`);
    }
  }
  if (new Set(urls).size !== urls.length) throw new Error(`${label}: importScripts() lists a file twice`);
  return { block: blocks[0][0], urls };
}

/**
 * Builds the hashed bundle.
 * @param {{ rootDir?: string, outDir?: string }} [options] rootDir: project root; outDir: where to write
 *   (default <rootDir>/public/worker-bundle).
 * @returns {{ urls: Record<string, string>, files: string[], outDir: string }}
 */
export function buildWorkerBundle({ rootDir = DEFAULT_ROOT, outDir } = {}) {
  const publicDir = path.join(rootDir, "public");
  const target = outDir ?? path.join(publicDir, BUNDLE_DIR_NAME);
  const files = new Map(); // emitted file name -> content
  const dependencyUrl = new Map(); // original "/vendor/…/X.js" -> "/worker-bundle/X.<hash>.js"
  const nameOwner = new Map(); // emitted base name -> original url, to catch basename collisions

  const publicFile = (url) => path.join(publicDir, ...url.split("/").filter(Boolean));

  function emit(url, text) {
    const base = path.basename(url, ".js");
    const name = `${base}.${contentHash(text)}.js`;
    const owner = nameOwner.get(base);
    if (owner !== undefined && owner !== url) {
      throw new Error(`worker bundle: ${url} and ${owner} share the file name ${base}.js; rename one`);
    }
    nameOwner.set(base, url);
    files.set(name, text);
    return name;
  }

  const urls = {};
  for (const entry of ENTRY_WORKERS) {
    const label = entry.source;
    const source = readNormalized(path.join(publicDir, entry.source));
    const { block, urls: deps } = parseImports(source, label);

    let rewrittenBlock = block;
    for (const dep of deps) {
      if (!dependencyUrl.has(dep)) {
        const text = readNormalized(publicFile(dep));
        // The Merkle scheme only holds if a dependency cannot pull in further, unversioned code.
        if (/\bimportScripts\s*\(|\bnew\s+(?:Shared)?Worker\s*\(/.test(text)) {
          throw new Error(`worker bundle: ${dep} loads further scripts itself; it cannot be content-hashed safely`);
        }
        dependencyUrl.set(dep, BUNDLE_URL_PREFIX + emit(dep, text));
      }
      rewrittenBlock = rewrittenBlock.replace(`"${dep}"`, `"${dependencyUrl.get(dep)}"`);
    }
    if (source.split("importScripts(").length !== 2) {
      throw new Error(`${label}: importScripts() is used outside the single versioned call`);
    }
    const rewritten = source.replace(block, () => rewrittenBlock);
    urls[entry.key] = BUNDLE_URL_PREFIX + emit(`/${entry.source}`, rewritten);
  }

  writeIdempotently(target, files);
  return { urls, files: [...files.keys()].sort(), outDir: target };
}

// Several Next.js processes may load next.config.ts at the same time, so never delete-then-write:
// write each file only when missing/different (via rename, so readers never see a partial file) and
// drop only files left over from earlier content.
function writeIdempotently(dir, files) {
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, text] of files) {
    const file = path.join(dir, name);
    if (fs.existsSync(file) && fs.readFileSync(file, "utf8") === text) continue;
    const tmp = path.join(dir, `.${name}.${process.pid}.tmp`);
    fs.writeFileSync(tmp, text, "utf8");
    fs.renameSync(tmp, file);
  }
  for (const existing of fs.readdirSync(dir)) {
    if (HASHED_NAME.test(existing) && !files.has(existing)) fs.rmSync(path.join(dir, existing), { force: true });
  }
}
