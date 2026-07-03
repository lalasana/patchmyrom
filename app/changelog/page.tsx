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

      <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Changelog</h1>

      <div className="flex flex-col gap-4">
        {entries.map((entry) => (
          <section key={entry.version} className="card px-5 py-5">
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
