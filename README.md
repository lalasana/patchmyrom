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

## GBA Play promotion

The Play Store URL lives in one place: `GBA_PLAY_URL` in `lib/gba-play.ts`.

- `components/ui/GbaPlayCta.tsx` — recommendation card (home, GBA/GBC pages, patch result). Android visitors get stronger
  copy ("Best GBA Emulator") swapped in after hydration; static HTML carries the desktop/iOS copy. On the patch result screen the card
  sits above the Download button on Android and below it elsewhere. The download flow itself is unchanged.
- `app/gba-play/page.tsx` — dedicated landing page. Screenshots are in `public/gba-play/` (replace files, same names).
  The app icon is still a placeholder tile (see the TODO in that page).
- Analytics: `gba_play_cta_view` / `gba_play_cta_click` with `placement` = `success | home | gba_page | gbc_page | gba_play_page`,
  forwarded to an existing `gtag`/`dataLayer` only if the visitor accepted analytics cookies. No provider is bundled.
