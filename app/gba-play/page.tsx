import type { Metadata } from "next";
import Link from "next/link";
import { GBA_EMULATOR_PAGE } from "@/lib/gba-emulator";

/**
 * Legacy URL. The real permanent (301) redirect is public/_redirects, which Cloudflare Pages applies
 * before any static file is served. This page is only the fallback for hosts that ignore _redirects
 * (or for anyone opening the exported file directly): it canonicalises and meta-refreshes to the new
 * page. It carries no promotional content and is not listed in the sitemap.
 */
export const metadata: Metadata = {
  title: "Moved to GBA Emulator",
  alternates: { canonical: GBA_EMULATOR_PAGE },
};

export default function LegacyGbaPlayRedirect() {
  const target = `${GBA_EMULATOR_PAGE}/`;
  return (
    <div className="container-page flex flex-col items-center gap-4 py-24 text-center">
      <meta httpEquiv="refresh" content={`0; url=${target}`} />
      <p className="text-muted">This page has moved.</p>
      <Link href={GBA_EMULATOR_PAGE} className="font-medium text-accent-blue hover:underline">
        Continue to GBA Emulator
      </Link>
    </div>
  );
}
