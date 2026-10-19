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
