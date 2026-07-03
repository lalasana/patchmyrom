import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import RelatedGuides from "@/components/ui/RelatedGuides";
import { FormatChip } from "@/components/ui/FormatBadge";
import { IconArrowRight } from "@/components/ui/icons";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "ROM Patch Formats Explained — IPS vs UPS vs BPS vs xdelta",
  description:
    "Understand the differences between IPS, UPS, BPS, and xdelta ROM patch formats, and which one you need.",
  path: "/patch-formats",
});

const formats = [
  {
    name: "IPS",
    chip: "IPS" as const,
    border: "border-l-accent-green/50",
    href: "/ips-patcher",
    summary: "International Patching System — the original and most widely supported format.",
    details: [
      "Simple byte-offset diff format, dating back to the SNES era.",
      "Limited to files smaller than ~16 MB, which can be a problem for larger modern hacks.",
      "No built-in checksum, so applying it to the wrong ROM can silently corrupt the file.",
    ],
  },
  {
    name: "UPS",
    chip: "UPS" as const,
    border: "border-l-accent-blue/50",
    href: "/ups-patcher",
    summary: "Universal Patching System — adds checksum verification over IPS.",
    details: [
      "Verifies both the source and resulting ROM with a CRC32 checksum.",
      "Rejects patching if your base ROM doesn't match what the patch expects.",
      "Common for SNES and GBA translation patches.",
    ],
  },
  {
    name: "BPS",
    chip: "BPS" as const,
    border: "border-l-purple-500/50",
    href: "/bps-patcher",
    summary: "Beat Patching System — a modern successor to UPS, popular for Pokemon hacks.",
    details: [
      "Supports more efficient diffs and larger files than IPS.",
      "Includes checksum verification for source, target, and the patch itself.",
      "The de-facto standard for many contemporary ROM hacking communities.",
    ],
  },
  {
    name: "xdelta",
    chip: "XDelta" as const,
    border: "border-l-amber-500/50",
    href: "/xdelta-patcher",
    summary: "A general-purpose binary diff/patch format, not ROM-hacking specific.",
    details: [
      "Handles very large files well, making it common for DS, 3DS, and disc-based games.",
      "Not originally designed for ROM hacking, but widely adopted for larger projects.",
    ],
  },
];

export default function PatchFormatsPage() {
  return (
    <div className="container-page flex flex-col gap-10 py-10 sm:py-14">
      <Breadcrumbs items={[{ href: "/patch-formats", label: "Patch Formats" }]} />

      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">ROM Patch Formats Explained</h1>
        <p className="max-w-2xl text-muted sm:text-lg">
          A quick reference for the most common ROM patch formats and when you&rsquo;ll encounter
          each one.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {formats.map((format) => (
          <section
            key={format.name}
            className={`rounded-xl border border-border border-l-4 bg-card px-5 py-5 ${format.border}`}
          >
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-foreground">{format.name}</h2>
              <FormatChip format={format.chip} />
            </div>
            <p className="mt-2 text-muted">{format.summary}</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
              {format.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
            <Link
              href={format.href}
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent-blue hover:underline"
            >
              Full {format.name} patcher guide
              <IconArrowRight className="h-3.5 w-3.5" />
            </Link>
          </section>
        ))}
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold text-foreground">Related Guides</h2>
        <RelatedGuides
          items={[
            {
              href: "/",
              title: "ROM Patcher",
              description: "Patch a ROM file directly in your browser.",
            },
            {
              href: "/how-to-patch-pokemon-rom-hacks",
              title: "How to Patch Pokemon ROM Hacks",
              description: "A step-by-step guide for Pokemon ROM hack patching.",
            },
            {
              href: "/troubleshooting",
              title: "Troubleshooting",
              description: "Fix common ROM patching errors and mismatches.",
            },
            {
              href: "/pokemon-rom-patcher",
              title: "Pokemon ROM Patcher",
              description: "Base ROM and format reference for 50 popular Pokemon ROM hacks.",
            },
          ]}
        />
      </section>
    </div>
  );
}
