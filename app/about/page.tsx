import type { Metadata } from "next";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "About",
  description: "About PatchMyROM — a free, browser-based ROM patching tool.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="container-page flex flex-col gap-8 py-10 sm:py-14">
      <Breadcrumbs items={[{ href: "/about", label: "About" }]} />

      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">About PatchMyROM</h1>
      </div>

      <section className="flex flex-col gap-3 text-muted">
        <p>
          PatchMyROM is a free, browser-based tool for applying ROM patch files (IPS, UPS, BPS,
          and xdelta) to your own legally-dumped game backups. The project&rsquo;s goal is simple:
          make ROM patching accessible without requiring desktop software, accounts, or file
          uploads.
        </p>
        <p>
          Everything runs client-side. Your ROM and patch files are processed locally in your
          browser and are never sent to any server.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-foreground">Project Status</h2>
        <p className="text-muted">
          PatchMyROM&rsquo;s ROM patcher runs entirely in your browser, powered by an open-source
          patching engine running inside a Web Worker so the page never freezes on large ROM
          files. The rest of the site is still an early, growing preview.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-foreground">Attribution</h2>
        <p className="text-muted">
          PatchMyROM&rsquo;s patch engine is powered by{" "}
          <a
            href="https://github.com/marcrobledo/RomPatcher.js"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-blue hover:underline"
          >
            RomPatcher.js
          </a>{" "}
          by Marc Robledo, an open-source, MIT-licensed, browser-based ROM patching library. It
          runs entirely client-side, inside a Web Worker on this site — your files are never
          uploaded anywhere.
        </p>
      </section>
    </div>
  );
}
