import type { Metadata } from "next";
import Link from "next/link";
import RomPatcherTool from "@/components/tool/RomPatcherTool";
import PrivacyNote from "@/components/ui/PrivacyNote";
import FaqAccordion from "@/components/ui/FaqAccordion";
import RelatedGuides from "@/components/ui/RelatedGuides";
import TroubleshootingCard from "@/components/ui/TroubleshootingCard";
import GbaEmulatorCta from "@/components/ui/GbaEmulatorCta";
import AdSlot from "@/components/ads/AdSlot";
import SectionHeading from "@/components/ui/SectionHeading";
import BackgroundGlow from "@/components/ui/BackgroundGlow";
import PatchHero from "@/components/ui/PatchHero";
import CardArt, { type CardArtAccent, type CardArtName } from "@/components/ui/CardArt";
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

const steps: { title: string; description: string; icon: React.ReactNode; art: CardArtName; accent: CardArtAccent }[] = [
  {
    title: "Choose your original ROM",
    description: "Select your own legally-dumped ROM backup from your device.",
    icon: <IconCartridge />,
    art: "cartridge",
    accent: "green",
  },
  {
    title: "Add the patch file",
    description: "Select the IPS, UPS, BPS, or xdelta patch you want to apply.",
    icon: <IconPatchFile />,
    art: "patch",
    accent: "blue",
  },
  {
    title: "Download the patched output",
    description: "Generated entirely in your browser, ready to load in your emulator.",
    icon: <IconDownloadTray />,
    art: "download",
    accent: "purple",
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

        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="flex flex-col gap-6 text-center lg:text-left">
            <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              ROM <span className="hero-shimmer">Patcher</span>
            </h1>
            <p className="max-w-xl text-balance text-muted sm:text-lg lg:max-w-lg">
              Apply IPS, UPS, BPS, and xdelta patches to your ROM files in seconds — entirely in
              your browser. Nothing you select is ever uploaded to {siteConfig.domain}.
            </p>
            <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
              <TrustBadge icon={<IconBolt />} label="Browser-based" />
              <TrustBadge icon={<IconCloudOff />} label="No server upload" />
              <TrustBadge icon={<IconLayers />} label="IPS / UPS / BPS / XDelta" />
              <TrustBadge icon={<IconSmartphone />} label="Mobile friendly" />
            </div>

            <div className="retro-window hidden max-w-xl lg:block">
              <div className="retro-titlebar">
                <span aria-hidden className="retro-dot bg-rose-400" />
                <span aria-hidden className="retro-dot bg-amber-300" />
                <span aria-hidden className="retro-dot bg-accent-green" />
              </div>
              <div className="flex flex-col gap-4 p-5">
                <div className="flex items-center justify-between text-xs font-medium text-muted">
                  <span className="flex items-center gap-1.5 text-sm text-accent-green">
                    <IconCartridge className="h-4 w-4" /> ROM
                  </span>
                  <IconArrowRight className="h-4 w-4 text-border" />
                  <span className="flex items-center gap-1.5 text-sm text-accent-blue">
                    <IconPatchFile className="h-4 w-4" /> Patch
                  </span>
                  <IconArrowRight className="h-4 w-4 text-border" />
                  <span className="flex items-center gap-1.5 text-sm text-purple-300">
                    <IconDownloadTray className="h-4 w-4" /> Output
                  </span>
                </div>
                <div className="pixel-rule" />
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

          <PatchHero className="max-w-[280px] sm:max-w-[360px] lg:max-w-[420px]" />
        </div>

        <div className="mt-10 flex flex-col gap-6">
          <RomPatcherTool />
          <GbaEmulatorCta placement="home" note="Works with GBA, GBC and GB games only — Nintendo DS games are not supported." />
          <PrivacyNote />
        </div>
      </section>

      <div className="container-page flex flex-col gap-16">
        <section className="flex flex-col gap-4">
          <SectionHeading icon={<IconInfo />} title="What Is a ROM Patcher?" accent="blue" />
          <div className="pixel-card border-l-4 border-l-accent-blue p-5">
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
              <div key={step.title} className="pixel-card pixel-hover group flex flex-col overflow-hidden">
                <div className="relative">
                  <CardArt name={step.art} accent={step.accent} className="h-36" />
                  <span className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-green to-accent-blue text-base font-extrabold text-background shadow-[0_6px_16px_-4px_rgba(57,224,127,0.6)]">
                    {index + 1}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 p-5">
                  <p className="text-lg font-bold text-foreground">{step.title}</p>
                  <p className="text-sm leading-relaxed text-muted">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="pixel-rule" />

        <section className="flex flex-col gap-4">
          <SectionHeading icon={<IconPatchFile />} title="Supported ROM Patch Formats" accent="blue" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
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

        <section className="retro-window overflow-hidden bg-gradient-to-br from-purple-500/15 via-card to-accent-blue/10 p-6 sm:p-8">
          <div className="flex flex-col gap-6">
            <SectionHeading icon={<IconGamepad />} title="Pokemon ROM Patcher" accent="purple" />
            <p className="max-w-3xl text-muted">
              Pokemon ROM hacks are one of the most popular uses for ROM patching, from difficulty
              overhauls to full new regions. PatchMyROM is built with Pokemon ROM hacks in mind.
            </p>

            <div className="overflow-x-auto rounded-lg border-2 border-border bg-background/40">
              <table className="w-full min-w-[420px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-border bg-card/80 text-accent-green">
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

        <section className="pixel-card bg-purple-500/5 p-6 sm:p-8">
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

        <div className="pixel-rule" />

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
            {
              href: "/rom-checksum-checker",
              title: "ROM Checksum Checker",
              description: "Get a ROM's CRC32, MD5, SHA-1 and SHA-256 and compare them with a published value.",
            },
            {
              href: "/patch-compatibility-checker",
              title: "ROM & Patch Compatibility Checker",
              description: "Check whether a ROM matches a patch before you patch it.",
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
