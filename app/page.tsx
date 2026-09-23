import type { Metadata } from "next";
import Link from "next/link";
import RomPatcherTool from "@/components/tool/RomPatcherTool";
import PrivacyNote from "@/components/ui/PrivacyNote";
import FaqAccordion from "@/components/ui/FaqAccordion";
import RelatedGuides from "@/components/ui/RelatedGuides";
import TroubleshootingCard from "@/components/ui/TroubleshootingCard";
import GbaPlayCta from "@/components/ui/GbaPlayCta";
import AdSlot from "@/components/ads/AdSlot";
import SectionHeading from "@/components/ui/SectionHeading";
import BackgroundGlow from "@/components/ui/BackgroundGlow";
import { TrustBadge } from "@/components/ui/TrustBadge";
import { FormatBadge, FormatChip, FORMAT_KEYS } from "@/components/ui/FormatBadge";
import { ButtonLink } from "@/components/ui/Button";
import {
  IconBolt,
  IconCloudOff,
  IconSmartphone,
  IconLayers,
  IconInfo,
  IconGamepad,
  IconAlertTriangle,
  IconDatabase,
  IconMonitorX,
  IconFileQuestion,
  IconArrowRight,
  IconCartridge,
  IconPatchFile,
  IconDownloadTray,
} from "@/components/ui/icons";
import JsonLd from "@/components/seo/JsonLd";
import { siteConfig } from "@/lib/site";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "ROM Patcher — Patch ROM Files Online, Locally in Your Browser",
  description:
    "Free browser-based ROM patcher for IPS, UPS, BPS, and xdelta patches. Files are processed locally — nothing is uploaded.",
  path: "/",
});

const FORMAT_PAGE_LINKS: Partial<Record<(typeof FORMAT_KEYS)[number], string>> = {
  IPS: "/ips-patcher",
  UPS: "/ups-patcher",
  BPS: "/bps-patcher",
  XDelta: "/xdelta-patcher",
};

const troubleshooting = [
  {
    problem: "Checksum mismatch",
    solution: "The patch's built-in checksum doesn't match your ROM. This usually means the wrong base ROM version was used.",
    icon: <IconAlertTriangle />,
  },
  {
    problem: "Wrong base ROM",
    solution: "Confirm the required region and revision (USA/EU/JP, v1.0/v1.1) from the hack's documentation before patching.",
    icon: <IconDatabase />,
  },
  {
    problem: "White screen after patching",
    solution: "Usually caused by a corrupted ROM, an incomplete download, or patching an already-modified file.",
    icon: <IconMonitorX />,
  },
  {
    problem: "Unsupported patch format",
    solution: "Double check the patch file's extension matches its actual format (.ips, .ups, .bps, .xdelta).",
    icon: <IconFileQuestion />,
  },
];

const pokemonHacks = [
  { name: "Radical Red", base: "FireRed", type: "UPS" },
  { name: "Unbound", base: "FireRed", type: "UPS" },
  { name: "Emerald Rogue", base: "Emerald", type: "BPS / UPS" },
  { name: "Gaia", base: "FireRed", type: "UPS" },
];

const steps = [
  {
    title: "Choose your original ROM",
    description: "Select your own legally-dumped ROM backup from your device.",
    icon: <IconCartridge />,
  },
  {
    title: "Add the patch file",
    description: "Select the IPS, UPS, BPS, or xdelta patch you want to apply.",
    icon: <IconPatchFile />,
  },
  {
    title: "Download the patched output",
    description: "Generated entirely in your browser, ready to load in your emulator.",
    icon: <IconDownloadTray />,
  },
];

const faqItems = [
  {
    question: "Is it safe to patch ROMs here?",
    answer:
      "Yes. All patching happens locally in your browser using the File API. Your ROM and patch files are never uploaded to a server.",
  },
  {
    question: "Do I need to download any software?",
    answer: "No. PatchMyROM runs entirely in your browser — no installation required.",
  },
  {
    question: "What patch formats are supported?",
    answer: "IPS, UPS, BPS, and xdelta patches are all supported, applied locally in your browser.",
  },
  {
    question: "Where do I get ROM files?",
    answer:
      "PatchMyROM does not provide ROM files. You are responsible for legally dumping your own game backups.",
  },
];

export default function HomePage() {
  const softwareApplicationJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any (runs in a web browser)",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <div className="flex flex-col gap-16 py-10 sm:py-14">
      <JsonLd data={softwareApplicationJsonLd} />
      <section className="container-page relative">
        <BackgroundGlow />

        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="flex flex-col gap-5 text-center lg:text-left">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              ROM <span className="bg-gradient-to-r from-accent-green to-accent-blue bg-clip-text text-transparent">Patcher</span>
            </h1>
            <p className="max-w-xl text-balance text-muted sm:text-lg">
              Apply IPS, UPS, BPS, and xdelta patches to your ROM files in seconds — entirely in
              your browser. Nothing you select is ever uploaded to {siteConfig.domain}.
            </p>
            <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
              <TrustBadge icon={<IconBolt />} label="Browser-based" />
              <TrustBadge icon={<IconCloudOff />} label="No server upload" />
              <TrustBadge icon={<IconLayers />} label="IPS / UPS / BPS / XDelta" />
              <TrustBadge icon={<IconSmartphone />} label="Mobile friendly" />
            </div>
          </div>

          <div className="glow-border hidden rounded-2xl lg:block">
            <div className="card flex flex-col gap-5 rounded-2xl p-6">
              <div className="flex items-center justify-between text-xs font-medium text-muted">
                <span className="flex items-center gap-1.5 text-accent-green">
                  <IconCartridge className="h-4 w-4" /> ROM
                </span>
                <IconArrowRight className="h-4 w-4 text-border" />
                <span className="flex items-center gap-1.5 text-accent-blue">
                  <IconPatchFile className="h-4 w-4" /> Patch
                </span>
                <IconArrowRight className="h-4 w-4 text-border" />
                <span className="flex items-center gap-1.5 text-purple-300">
                  <IconDownloadTray className="h-4 w-4" /> Output
                </span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex flex-wrap gap-2">
                {FORMAT_KEYS.map((format) => (
                  <FormatChip key={format} format={format} />
                ))}
              </div>
              <p className="text-xs text-muted">
                Every format is read and applied entirely on-device — nothing leaves your browser.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-6">
          <RomPatcherTool />
          <GbaPlayCta placement="home" />
          <PrivacyNote />
        </div>
      </section>

      <div className="container-page flex flex-col gap-16">
        <section className="flex flex-col gap-4">
          <SectionHeading icon={<IconInfo />} title="What Is a ROM Patcher?" accent="blue" />
          <div className="rounded-xl border-l-4 border-accent-blue/40 bg-card/40 p-5">
            <p className="max-w-3xl text-muted">
              A ROM patcher applies a set of binary differences (a &ldquo;patch&rdquo;) to an
              original ROM file, producing a modified version — commonly used for fan
              translations, bug fixes, and ROM hacks. Instead of distributing a full modified ROM
              (which would include copyrighted game data), creators distribute a small patch file
              that only contains the differences.
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeading icon={<IconLayers />} title="How It Works" accent="green" />
          <div className="grid gap-4 sm:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="card group flex flex-col gap-3 rounded-xl p-5 transition-all hover:-translate-y-1 hover:border-accent-green/40 hover:shadow-lg hover:shadow-accent-green/5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-gradient-to-br from-accent-green to-accent-blue text-xs font-bold text-background">
                    {index + 1}
                  </span>
                  <span className="text-accent-blue [&>svg]:h-5 [&>svg]:w-5">{step.icon}</span>
                </div>
                <p className="text-sm font-semibold text-foreground">{step.title}</p>
                <p className="text-sm text-muted">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

        <section className="flex flex-col gap-4">
          <SectionHeading icon={<IconPatchFile />} title="Supported ROM Patch Formats" accent="blue" />
          <div className="grid gap-3 sm:grid-cols-3">
            {FORMAT_KEYS.map((format) => {
              const href = FORMAT_PAGE_LINKS[format];
              const badge = <FormatBadge format={format} />;
              return href ? (
                <Link key={format} href={href} className="block transition-transform hover:-translate-y-0.5">
                  {badge}
                </Link>
              ) : (
                <div key={format}>{badge}</div>
              );
            })}
          </div>
        </section>

        <AdSlot label="In-content ad slot" />

        <section className="overflow-hidden rounded-2xl border border-purple-500/25 bg-gradient-to-br from-purple-500/10 via-card to-accent-blue/5 p-6 sm:p-8">
          <div className="flex flex-col gap-6">
            <SectionHeading icon={<IconGamepad />} title="Pokemon ROM Patcher" accent="purple" />
            <p className="max-w-3xl text-muted">
              Pokemon ROM hacks are one of the most popular uses for ROM patching, from difficulty
              overhauls to full new regions. PatchMyROM is built with Pokemon ROM hacks in mind.
            </p>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[420px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-card/60 text-muted">
                    <th className="px-4 py-3 font-medium">ROM Hack</th>
                    <th className="px-4 py-3 font-medium">Base Game</th>
                    <th className="px-4 py-3 font-medium">Patch Type</th>
                  </tr>
                </thead>
                <tbody>
                  {pokemonHacks.map((hack) => (
                    <tr key={hack.name} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-3 font-medium text-foreground">{hack.name}</td>
                      <td className="px-4 py-3 text-muted">{hack.base}</td>
                      <td className="px-4 py-3 text-muted">{hack.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <ButtonLink href="/pokemon-rom-patcher" variant="primary" className="w-fit">
                Open Pokemon ROM Patcher
                <IconArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-6 sm:p-8">
          <div className="flex flex-col gap-4">
            <SectionHeading icon={<IconGamepad />} title="GBA ROM Patcher" accent="purple" />
            <p className="max-w-3xl text-muted">
              Game Boy Advance ROM hacks commonly use IPS, UPS, or BPS patches. Larger GBA hacks
              increasingly rely on BPS due to its support for bigger file sizes and stronger
              verification against the wrong base ROM.
            </p>
            <div>
              <Link
                href="/gba-rom-patcher"
                className="inline-flex items-center gap-1 text-sm font-medium text-accent-blue hover:underline"
              >
                Full GBA ROM patcher guide
                <IconArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeading icon={<IconAlertTriangle />} title="Common ROM Patching Problems" accent="amber" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {troubleshooting.map((item) => (
              <TroubleshootingCard
                key={item.problem}
                problem={item.problem}
                solution={item.solution}
                icon={item.icon}
                href="/troubleshooting"
              />
            ))}
          </div>
        </section>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

        <section className="flex flex-col gap-4">
          <SectionHeading icon={<IconLayers />} title="Related Guides" accent="blue" />
          <RelatedGuides
            items={[
              {
                href: "/patch-formats",
                title: "Patch Formats Explained",
                description: "IPS vs UPS vs BPS vs xdelta — which one do you need?",
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
                description: "Format tips and notes specific to Pokemon ROM hacks.",
              },
            ]}
          />
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeading icon={<IconInfo />} title="FAQ" accent="blue" />
          <FaqAccordion items={faqItems} />
        </section>
      </div>
    </div>
  );
}
