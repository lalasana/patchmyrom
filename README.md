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

## xdelta / VCDIFF

- `public/workers/vcdiff-secondary.js` runs *before* the vendored (unmodified) VCDIFF decoder in both workers. `inspect()` is a cheap structural scan used at file selection (flags damaged/truncated patches, unsupported compressors, oversized declarations); `prepare()` decodes LZMA-compressed sections into an equivalent plain VCDIFF that the vendored decoder applies unchanged; `verifyOutput()` checks every window's Adler-32 against the patched bytes, so a wrong source ROM or damaged patch is discarded instead of offered.
- **Supported:** no secondary compression, and **LZMA** (xdelta3 secondary id 2: each section is an .xz/LZMA2 stream, one continuous stream per section type across windows). Self-contained decoder, no WebAssembly, no dependencies, original code (provenance and licence notes in the file header).
- **Not supported (clear message, no output):** DJW (id 1), FGK (id 16), unknown ids, custom code tables, patches that would produce more than 1 GiB. xdelta3's DJW/FGK code is GPL-2.0-or-later and was deliberately not ported.
- **Limits** (hostile-input protection, far above real patches): 1 GiB output, 1 GiB decompressed sections, 131072 windows, and per compressed section at most 16 MiB + 1024 bytes per compressed byte. Memory: roughly twice the *decompressed patch* extra while decoding (not twice the ROM).
- **What the UI may claim** (`lib/output-verification.ts`): *verified* only when every window carries an Adler-32 and all matched; *partly verified* when only some do; *created but not verifiable* for patches with no checksum (`xdelta3 -n`, IPS, etc.). A wrong source ROM is detected only when the patch carries checksums — xdelta has no source checksum, so patches without one cannot detect it.
- Tests: `tests/xdelta.test.mjs` (real xdelta3 fixtures), `tests/xdelta-security.test.mjs` (bombs, limits, tampering, verification claims, fuzzing); fixtures documented in `tests/fixtures/README.md`.
