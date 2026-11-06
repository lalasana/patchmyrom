import PageHero from "@/components/ui/PageHero";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import InlineLink from "@/components/ui/InlineLink";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "About",
  description: "About PatchMyROM — a free, browser-based tool for applying ROM patches and checking ROM files.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="container-page flex flex-col gap-8 py-10 sm:py-14">
      <Breadcrumbs items={[{ href: "/about", label: "About" }]} />

      <PageHero art="cartridge" accent="green">
<h1 className="text-3xl font-bold text-foreground sm:text-4xl">About PatchMyROM</h1>
      </PageHero>

      <section className="pixel-card flex flex-col gap-3 p-6 text-muted">
        <p>
          PatchMyROM is a free, browser-based tool for applying ROM patch files (IPS, UPS, BPS, and
          xdelta) to your own legally-dumped game backups. The goal is simple: make ROM patching
          accessible without desktop software, accounts, or file uploads.
        </p>
        <p>
          Everything runs client-side. Your ROM and patch files are processed locally in your
          browser and are never sent to any server.
        </p>
      </section>

      <section className="pixel-card flex flex-col gap-3 p-6">
        <h2 className="border-l-4 border-accent-green pl-3 text-xl font-bold text-foreground">What You Can Do Here</h2>
        <ul className="list-disc space-y-2 pl-5 text-muted">
          <li>
            Apply a patch with the <InlineLink href="/">ROM Patcher</InlineLink>. It reads the format from the
            patch file itself, checks UPS and BPS patches against the ROM before it starts, and verifies the
            result before offering it.
          </li>
          <li>
            Pick the page for your console or patch type, each with the patcher built in:{" "}
            <InlineLink href="/gba-rom-patcher">GBA</InlineLink>, <InlineLink href="/nds-rom-patcher">NDS</InlineLink>,{" "}
            <InlineLink href="/gbc-rom-patcher">GBC</InlineLink>, <InlineLink href="/nes-rom-patcher">NES</InlineLink>,{" "}
            <InlineLink href="/snes-rom-patcher">SNES</InlineLink>, and the{" "}
            <InlineLink href="/ips-patcher">IPS</InlineLink>, <InlineLink href="/ups-patcher">UPS</InlineLink>,{" "}
            <InlineLink href="/bps-patcher">BPS</InlineLink> and <InlineLink href="/xdelta-patcher">xdelta</InlineLink> pages.
          </li>
          <li>
            Check a file with the <InlineLink href="/rom-checksum-checker">ROM Checksum Checker</InlineLink>
            {" "}(CRC32, MD5, SHA-1, SHA-256 and console detection) or test a ROM against a patch first with the{" "}
            <InlineLink href="/patch-compatibility-checker">Patch Compatibility Checker</InlineLink>.
          </li>
          <li>
            Read the guides: <InlineLink href="/patch-formats">patch formats compared</InlineLink>,{" "}
            <InlineLink href="/troubleshooting">troubleshooting</InlineLink>, and the{" "}
            <InlineLink href="/pokemon-rom-patcher">Pokémon hack base ROM reference</InlineLink>.
          </li>
        </ul>
      </section>

      <section className="pixel-card flex flex-col gap-3 p-6">
        <h2 className="border-l-4 border-accent-green pl-3 text-xl font-bold text-foreground">Project Status</h2>
        <p className="text-muted">
          PatchMyROM is a finished, working site that is updated as the tools improve. The patch engine
          runs inside a Web Worker so the page never freezes on large ROM files, and patched files are
          checked against the patch&rsquo;s own checksums where the format provides them. The site uses Google
          Tag Manager, Google Analytics and Google AdSense, which run for every visitor; the{" "}
          <InlineLink href="/privacy#cookies">Privacy Policy</InlineLink> explains what that means for cookies. See the{" "}
          <InlineLink href="/changelog">changelog</InlineLink> for what has changed and when.
        </p>
      </section>

      <section className="pixel-card flex flex-col gap-3 p-6">
        <h2 className="border-l-4 border-accent-green pl-3 text-xl font-bold text-foreground">Attribution</h2>
        <p className="text-muted">
          PatchMyROM&rsquo;s patch engine is built on{" "}
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
          uploaded anywhere. The compatibility checks, output verification, LZMA support for xdelta
          patches and the checker tools are PatchMyROM&rsquo;s own additions.
        </p>
      </section>
    </div>
  );
}
