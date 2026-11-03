import PageHero from "@/components/ui/PageHero";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Changelog",
  description: "PatchMyROM version history and development progress.",
  path: "/changelog",
});

const entries = [
  {
    version: "Patcher on every tool page",
    date: "November 2026",
    changes: [
      "The GBA, NDS, GBC, NES and SNES pages and the IPS, UPS, BPS and xdelta pages now include the working patcher at the top, so you no longer have to go back to the home page.",
      "IPS patches are applied to your file exactly as supplied. Previously a header on an NES or SNES ROM was stripped first, which shifted every change when the patch had been made against the headered file.",
      "Rewrote the guidance on those pages to match what the patcher actually does, including the Game Boy header checksum (repaired for IPS patches only) and which xdelta variants are supported.",
      "Added a Patch Compatibility Checker and ROM Checksum Checker link to each page, and a note on the patch format selector that detection always wins.",
    ],
  },
  {
    version: "Visual redesign",
    date: "November 2026",
    changes: [
      "New retro-gaming look across the whole site: new logo and favicon, hero artwork, redesigned cards and a new patcher window.",
      "New social preview image for shared links.",
      "No changes to page addresses, titles, descriptions or the patching engine in this release.",
    ],
  },
  {
    version: "ROM Toolkit",
    date: "November 2026",
    changes: [
      "New ROM Checksum Checker: computes CRC32, MD5, SHA-1 and SHA-256 in your browser, compares them with a published checksum and identifies the console from the file's header.",
      "New Patch Compatibility Checker: tests whether a ROM matches an IPS, UPS, BPS or xdelta patch before you patch, and says plainly when a format has no checksum to verify.",
      "Fixed a freeze on malformed BPS patches: damaged or hostile files are now refused within a fraction of a second with a clear message.",
      "Web Workers are now served from content-hashed addresses, so a new release is never mixed with an old cached worker.",
    ],
  },
  {
    version: "Patch engine hardening",
    date: "October 2026",
    changes: [
      "xdelta patches that use LZMA secondary compression now apply; DJW and FGK ones are named and explained instead of failing obscurely.",
      "BPS and UPS patches now tell a wrong ROM apart from an already-patched one, and a patched result that fails the patch's checksum is discarded instead of offered.",
      "Running out of memory on a very large ROM now produces a clear message.",
    ],
  },
  {
    version: "Patch Engine",
    date: "July 2026",
    changes: [
      "Connected a real, local patch engine (RomPatcher.js, MIT licensed) — IPS, UPS, BPS, and xdelta patches now apply entirely in your browser.",
      "Patching runs in a Web Worker so the page never freezes, even on large NDS ROMs.",
      "Real progress reporting while reading large files, and a working download of the patched ROM.",
      "Still no analytics or ads connected.",
    ],
  },
  {
    version: "Phase 1",
    date: "July 2026",
    changes: [
      "Initial site structure, design system, and page shells built.",
      "ROM patcher UI (drop zones, format selector, progress, download result).",
      "Cookie consent banner and preferences modal.",
      "Legal and trust pages (About, Privacy, Terms, Disclaimer, DMCA, Contact).",
      "No patching engine, analytics, or ads connected yet.",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="container-page flex flex-col gap-8 py-10 sm:py-14">
      <Breadcrumbs items={[{ href: "/changelog", label: "Changelog" }]} />

      <PageHero art="changelog" accent="green">
<h1 className="text-3xl font-bold text-foreground sm:text-4xl">Changelog</h1>
      </PageHero>

      <div className="flex flex-col gap-4">
        {entries.map((entry) => (
          <section key={entry.version} className="card p-6">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-semibold text-foreground">{entry.version}</h2>
              <span className="text-sm text-muted">{entry.date}</span>
            </div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
              {entry.changes.map((change) => (
                <li key={change}>{change}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
