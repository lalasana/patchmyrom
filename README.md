This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## GBA Emulator promotion

The Play Store URL, names and placements live in one place: `lib/gba-emulator.ts` (`GBA_EMULATOR_URL`). The app is **GBA Emulator: Play Retro Games** by Gamesira (package `app.gbaemulator`). It supports GBA, GBC and GB only — never promote it for Nintendo DS.

- `components/ui/GbaEmulatorCta.tsx` — recommendation card (home, GBA/GBC/Pokemon pages, how-to guide, patch result). Android visitors get action-oriented copy swapped in after hydration; static HTML carries the desktop/iOS copy. On the patch result screen it only appears for .gba/.gbc/.gb outputs (`isGameBoyFamilyFile`).
- `app/gba-emulator/page.tsx` — dedicated landing page. Icon and the 8 screenshots are the app's own Google Play listing images, stored as webp in `public/gba-emulator/` (plus `og-gba-emulator.png`, built from them). Only claim features that appear in the Play listing.
- Old URL `/gba-play/`: permanent 301 via `public/_redirects` (Cloudflare Pages); `app/gba-play/page.tsx` is a canonical + meta-refresh fallback with no promo content.
- Analytics: `gba_emulator_cta_view` / `gba_emulator_cta_click` with `placement` = `success | home | gba_page | gbc_page | pokemon_page | guide_page | emulator_page`, forwarded to an existing `gtag`/`dataLayer` only if the visitor accepted analytics cookies. No provider is bundled.

## Web Worker caching and versioning

Cloudflare Pages serves unhashed static files with `max-age=14400, must-revalidate`, so an unversioned worker or decoder could be reused for up to four hours after a deploy, next to a new page. Workers are therefore loaded from content-hashed URLs:

- `scripts/worker-bundle.mjs` runs whenever `next.config.ts` is loaded (any build command; skipped by `next dev`). It copies each worker's `importScripts()` dependencies to `public/worker-bundle/<name>.<sha256-prefix>.js` (git-ignored, generated) and rewrites the entry workers to import those hashed URLs. The entry's own name hashes the *rewritten* content, so one URL pins one complete, consistent set (a change to any decoder re-versions both workers; unchanged files keep their URL and stay cached).
- The sources in `public/workers` and `public/vendor` are untouched (the vendored library stays unmodified, and the Node tests still run the real source files). Add a script to a worker's `importScripts()` list and it is versioned automatically; the generator refuses dynamic lists, query strings, or dependencies that load further scripts.
- `next.config.ts` passes the entry URLs to the app as `NEXT_PUBLIC_*_WORKER_URL`; `lib/worker-urls.ts` is the only place the hooks read them from. Never hard-code `/workers/...` in a `new Worker(...)` call.
- `public/_headers`: `/worker-bundle/*` is `immutable` for a year; the legacy unhashed `/workers/*` and `/vendor/*` stay published for tabs opened before this change but are `no-cache` (always revalidated). They can be deleted from the deploy once old tabs no longer matter.
- Tests: `tests/worker-bundle.test.mjs` (hash/content binding, determinism, CRLF-independence, which URLs change when a file changes, refusal of unsafe input, and the generated workers patching BPS/UPS/IPS/xdelta-LZMA identically to the sources).

## ROM toolkit (checksum checker, patch compatibility checker)

Two browser tools that reuse the patcher's engine; nothing is uploaded.

- **`/rom-checksum-checker`**: CRC32, MD5, SHA-1 and SHA-256 in one pass (`public/workers/stream-hash.js`, incremental hashers), compared with a pasted checksum, plus platform detection from the file's own header (`confirmed` / `extension-only` / `unknown`). `hash-worker.js` reads the file in 4 MB chunks, so memory stays flat for any size; only the first ~192 KB (and a few fixed SNES header locations) are kept for detection.
- **`/patch-compatibility-checker`**: `Compatible` / `Mismatch` / `Cannot verify` for a ROM and a patch. UPS and BPS use the same classifier as the patcher (`patch-compat.js`); RUP, APS and PMSR use the patching library's own `validateSource()`; IPS, xdelta, PPF and BDF store nothing about the ROM and are **never** reported as compatible. SNES copier headers are recognised with the library's own rules (`isRomHeadered`) and explained, never guessed at.
- **Shared core**: `public/workers/rom-toolkit.js` (pure functions; also loaded by the UI through `lib/rom-toolkit.ts` and by the Node tests). The two workers are entry workers of the hashed bundle (`scripts/worker-bundle.mjs`), so they are versioned like the patcher's.
- **Memory**: ROM checksums and UPS/BPS/IPS/xdelta/PPF checks stream the ROM (hashing keeps about 22 MB resident for a 320 MB file). RUP, APS and PMSR validation needs the whole ROM in memory (the library hashes it as one block or reads it at arbitrary offsets): measured peak is about 1.2x the ROM size in the worker (RUP and APS-GBA at 250 MB: about +300 MB), so those checks are limited by device (`RomToolkit.pickWholeRomLimit`, reasoning in its comment):

  | Device | Limit |
  | --- | --- |
  | reports 2 GB of memory or less | 32 MB |
  | any mobile browser | 64 MB |
  | desktop reporting under 8 GB | 64 MB |
  | desktop, memory not reported (Firefox, Safari) | 128 MB |
  | desktop reporting 8 GB or more | 256 MB (`RomToolkit.WHOLE_ROM_LIMIT`, the ceiling) |
  | the worker is told nothing | 64 MB (`DEFAULT_WHOLE_ROM_LIMIT`) |

  Above the limit the result is `Cannot verify` (`rom-too-large-for-validation`) with the limit, why it applies and what to do instead. The page can lower the limit, never raise it above the ceiling. **Phase 1.2 (not done):** replace the library's whole-ROM validation with streaming checks (RUP: one MD5 pass over the chunks the worker already reads; PMSR: the CRC32 it already computes; APS-GBA: per-block CRC16 from ranged reads) so these formats need no limit and no extra copy of the ROM.
- **Damaged and hostile patches**: the vendored parsers allocate and loop for as long as a patch's own numbers say (`BinFile.readBytes(len)` builds an array of `len` slots), and a worker stuck in a synchronous loop can never time itself out. Two layers: `RomToolkit.preflightPatchStructure()` rejects PMSR, BDF and RUP files whose record counts, offsets and declared lengths don't fit the file *before* the parser runs (a clear "damaged or incomplete" result); `PatchCompat.preflightPatch` (shared by the analysis, patch and compatibility workers) does the same for BPS numbers the vendored `BPS_getVLVLen` can't survive (it uses 32-bit shifts, so a size of 2^31 or more, an action over 512 MiB or a relative offset of 2^30 or more loops forever; covered by `tests/bps-malformed.test.mjs`), and every job runs under a main-thread watchdog (`public/workers/worker-session.js`, used by `hooks/useWorkerJob.ts`): no accepted message for 30 s (longer where the worker announced a bigger `compat-stage` budget) ends the job with `terminate()`. Cancel uses the same path. Known gap: the BDF check decompresses the patch's bzip2 sections (as the library then does again), so a decompression bomb inside a small `.bdf` is not prevented — only bounded in time by the watchdog; the patcher's own pre-existing use of these parsers is untouched.
- **Failure handling**: a `Worker` constructor that throws (CSP, privacy extension) or a worker script that fails to load (an old tab pointing at a hashed URL a deploy removed) ends in an error state with a "Reload page" button instead of a spinner. Screen readers get one always-mounted `role="status"` region per tool (progress in 25% steps, then the result), not a re-read of the whole result.
- **Accuracy rules**: APS (N64) stores only the game ID and header checksums and APS (GBA) only the checksums of the blocks it changes, so a match is reported as `Cannot verify` (`partial-match-header` / `partial-match-blocks`) with the partial match explained, never `Compatible`; a difference is still a real `Mismatch`. Header notes (e.g. an SNES copier header set aside) only say a comparison was made when one was. Platform detection requires more than a lone checksum for Game Boy (cartridge/ROM/RAM codes, 16 KB size), GBA (reserved bytes), DS (logo checksum, unit code) and SNES (map mode, ROM size); anything less falls back to the labelled `extension-only`.
- Tests: `tests/rom-toolkit.test.mjs` (hashers against `node:crypto`, checksum parsing, platform detection on synthetic header fixtures, every verdict, SNES headers, memory limit, chunked reads), `tests/toolkit-hardening.test.mjs` (structure preflight, damaged PMSR/BDF/RUP and extreme PPF/IPS/APS inputs in a child process with a hard timeout, PMSR against a forged 40 MB ROM with the exact CRC32, device limits, partial APS results, SNES header notes, N64 byte order, detection false positives), `tests/worker-session.test.mjs` (cancel, stall watchdog, constructor and load failures, races — fake Worker and fake clock) and `tests/toolkit-seo.test.mjs` (metadata, uniqueness, sitemap, links, no offline claim). Fixtures are generated (`tests/helpers/rom-fixtures.mjs`); no copyrighted data.

## xdelta / VCDIFF

- `public/workers/vcdiff-secondary.js` runs *before* the vendored (unmodified) VCDIFF decoder in both workers. `inspect()` is a cheap structural scan used at file selection (flags damaged/truncated patches, unsupported compressors, oversized declarations); `prepare()` decodes LZMA-compressed sections into an equivalent plain VCDIFF that the vendored decoder applies unchanged; `verifyOutput()` checks every window's Adler-32 against the patched bytes, so a wrong source ROM or damaged patch is discarded instead of offered.
- **Supported:** no secondary compression, and **LZMA** (xdelta3 secondary id 2: each section is an .xz/LZMA2 stream, one continuous stream per section type across windows). Self-contained decoder, no WebAssembly, no dependencies, original code (provenance and licence notes in the file header).
- **Not supported (clear message, no output):** DJW (id 1), FGK (id 16), unknown ids, custom code tables, patches that would produce more than 1 GiB. xdelta3's DJW/FGK code is GPL-2.0-or-later and was deliberately not ported.
- **Limits** (hostile-input protection, far above real patches): 1 GiB output, 1 GiB decompressed sections, 131072 windows, and per compressed section at most 16 MiB + 1024 bytes per compressed byte. Memory: roughly twice the *decompressed patch* extra while decoding (not twice the ROM).
- **What the UI may claim** (`lib/output-verification.ts`): *verified* only when every window carries an Adler-32 and all matched; *partly verified* when only some do; *created but not verifiable* for patches with no checksum (`xdelta3 -n`, IPS, etc.). A wrong source ROM is detected only when the patch carries checksums — xdelta has no source checksum, so patches without one cannot detect it.
- Tests: `tests/xdelta.test.mjs` (real xdelta3 fixtures), `tests/xdelta-security.test.mjs` (bombs, limits, tampering, verification claims, fuzzing); fixtures documented in `tests/fixtures/README.md`.
