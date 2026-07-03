import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";

type BuildPageMetadataOptions = {
  /** Page-specific title. Rendered as-is, with " | PatchMyROM" appended by the root layout's title template. */
  title: string;
  /** Page-specific description — also used for the OpenGraph/Twitter card so social shares reflect this page, not the site default. */
  description: string;
  /** Route path starting with "/", e.g. "/pokemon-rom-patcher" or "/" for the homepage. */
  path: string;
};

/**
 * Builds a complete per-page Metadata object so canonical URL, OpenGraph,
 * and Twitter card fields all reflect this specific page instead of
 * silently inheriting the root layout's homepage-oriented defaults (which
 * is what happens if a page only sets `title`/`description` without its
 * own `openGraph`/`twitter` blocks).
 */
export function buildPageMetadata({ title, description, path }: BuildPageMetadataOptions): Metadata {
  const url = `${siteConfig.url}${path}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      type: "website",
      images: [siteConfig.ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [siteConfig.ogImage],
    },
  };
}
