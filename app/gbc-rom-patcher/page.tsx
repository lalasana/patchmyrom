import type { Metadata } from "next";
import Link from "next/link";
import GbaPlayCta from "@/components/ui/GbaPlayCta";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import RelatedGuides from "@/components/ui/RelatedGuides";
import TroubleshootingCard from "@/components/ui/TroubleshootingCard";
import FaqAccordion from "@/components/ui/FaqAccordion";
import SectionHeading from "@/components/ui/SectionHeading";
import JsonLd from "@/components/seo/JsonLd";
import { ButtonLink } from "@/components/ui/Button";
import { FormatChip } from "@/components/ui/FormatBadge";
import {
  IconInfo,
  IconLayers,
  IconAlertTriangle,
  IconDatabase,
  IconShieldCheck,
  IconArrowRight,
} from "@/components/ui/icons";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "GBC ROM Patcher — Patch Game Boy Color ROMs Online",
  description:
    "Apply IPS or UPS patches to a Game Boy or Game Boy Color ROM in your browser, with automatic header checksum fixing.",
  path: "/gbc-rom-patcher",
});

const steps = [
  {
    title: "Start from a clean .gb or .gbc file",
    body: "Game Boy and Game Boy Color share the same underlying format, so patches are built against one or the other specifically.",
  },
  {
    title: "Get the patch",
    body: "Usually an .ips or .ups file, matched to a particular release of the original game.",
  },
  {
    title: "Select both files",
    body: "The tool reads the patch header to work out the format automatically.",
  },
  {
    title: "Download the patched ROM",
    body: "The header checksum is corrected automatically after patching, so the result boots cleanly on real hardware and emulators alike.",
  },
];

const mistakes = [
  {
    problem: "Confusing a GB-only game with a GBC-enhanced one",
    solution:
      "Some games have separate Game Boy and Game Boy Color releases with different data. A patch built for one won't line up with the other.",
    icon: <IconDatabase />,
  },
  {
    problem: "Assuming the header checksum will just work itself out",
    solution:
      "It usually will here — this patcher recalculates it after applying the patch — but tools that skip that step can leave you with a ROM that some hardware and emulators refuse to boot.",
    icon: <IconShieldCheck />,
  },
  {
    problem: "Patching a ROM with save data already baked in from an emulator export",
    solution:
      "Stick to a plain ROM dump rather than a save-state or combined export — patches expect the game data on its own.",
    icon: <IconAlertTriangle />,
  },
];

const troubleshooting = [
  {
    problem: "Real hardware or a strict emulator refuses to boot the patched ROM",
    solution:
      "Game Boy carts store a checksum of their own header, and some patching tools don't recalculate it after making changes. This patcher fixes that checksum automatically as part of applying the patch.",
    icon: <IconShieldCheck />,
  },
  {
    problem: "Patch is rejected outright",
    solution:
      "For UPS specifically, this points to a base ROM mismatch — double-check you have the exact release the patch was built against.",
    icon: <IconDatabase />,
  },
  {
    problem: "Colors look wrong on a Game Boy Color patch",
    solution:
      "Confirm you're running it on a GBC-capable emulator or hardware — a GBC-enhanced ROM run in GB-only mode will drop the color palette entirely.",
    icon: <IconAlertTriangle />,
  },
];

const faqItems = [
  {
    question: "What's the difference between patching for GB and GBC?",
    answer: "Mechanically the patch process is the same. The difference is which original ROM the patch expects — a Game Boy Color release often has different data than an original Game Boy version of the same game.",
  },
  {
    question: "Why does a header checksum matter for Game Boy ROMs?",
    answer: "The cartridge header stores a checksum the hardware checks before running the game. If patching changes header-adjacent bytes without updating that checksum, some hardware and stricter emulators will refuse to boot it.",
  },
  {
    question: "Which patch formats show up for GB/GBC hacks?",
    answer: "Mostly IPS and UPS. The ROMs are small by modern standards, so IPS's size limit is rarely an issue here the way it can be on other platforms.",
  },
  {
    question: "Does this patcher fix the header checksum for me?",
    answer: "Yes — it recalculates the Game Boy header checksum automatically after applying a patch, so you don't need a separate tool for that step.",
  },
];

export default function GbcRomPatcherPage() {
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Patch a Game Boy Color ROM",
    description: "Steps to apply an IPS or UPS patch to a Game Boy or Game Boy Color ROM using a browser-based patcher.",
    step: steps.map((step) => ({
      "@type": "HowToStep",
      name: step.title,
      text: step.body,
    })),
  };

  return (
    <div className="container-page flex flex-col gap-10 py-10 sm:py-14">
      <JsonLd data={howToJsonLd} />
      <Breadcrumbs items={[{ href: "/gbc-rom-patcher", label: "GBC ROM Patcher" }]} />

      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">GBC ROM Patcher</h1>
        <p className="max-w-2xl text-muted sm:text-lg">
          Game Boy and Game Boy Color ROMs patch the same way — the detail that trips people up
          is the cartridge header checksum, which this tool handles for you.
        </p>
        <div className="flex gap-2">
          <FormatChip format="IPS" />
          <FormatChip format="UPS" />
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconShieldCheck />} title="The Header Checksum Quirk" accent="green" />
        <div className="rounded-xl border-l-4 border-accent-green/40 bg-card/40 p-5">
          <p className="max-w-3xl text-muted">
            Every Game Boy cartridge header stores a small checksum of itself, and the hardware
            checks it before running anything. Most patches don&apos;t touch the header directly, but
            when they do — or when a patching tool doesn&apos;t bother recalculating it — you can end
            up with a ROM that plays fine in some emulators and gets flatly rejected by others,
            or by real hardware. This patcher recalculates that checksum automatically once a
            patch has been applied, so it&apos;s one less thing to think about.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconLayers />} title="Step-by-Step" accent="blue" />
        <div className="grid gap-4 sm:grid-cols-2">
          {steps.map((step, index) => (
            <div key={step.title} className="card flex gap-4 rounded-xl p-5">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-gradient-to-br from-accent-green to-accent-blue text-xs font-bold text-background">
                {index + 1}
              </span>
              <div>
                <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                <p className="mt-1 text-sm text-muted">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div>
          <ButtonLink href="/" variant="primary" className="w-fit">
            Patch a GBC ROM now
            <IconArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
        <GbaPlayCta placement="gbc_page" />
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconAlertTriangle />} title="Mistakes That Trip Up GBC Patching" accent="amber" />
        <div className="grid gap-4 sm:grid-cols-3">
          {mistakes.map((item) => (
            <TroubleshootingCard
              key={item.problem}
              problem={item.problem}
              solution={item.solution}
              icon={item.icon}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconDatabase />} title="Troubleshooting" accent="amber" />
        <div className="grid gap-4 sm:grid-cols-3">
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

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconInfo />} title="FAQ" accent="blue" />
        <FaqAccordion items={faqItems} />
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconLayers />} title="Related Guides" accent="blue" />
        <RelatedGuides
          items={[
            {
              href: "/",
              title: "ROM Patcher",
              description: "Patch a ROM file directly in your browser.",
            },
            {
              href: "/ips-patcher",
              title: "IPS Patcher",
              description: "The most common format for classic Game Boy era hacks.",
            },
            {
              href: "/ups-patcher",
              title: "UPS Patcher",
              description: "Checksum-verified patching, also common on GBC.",
            },
            {
              href: "/nes-rom-patcher",
              title: "NES ROM Patcher",
              description: "Another header-sensitive platform from the same era.",
            },
          ]}
        />
      </section>

      <div className="card flex flex-col items-center gap-3 rounded-2xl p-6 text-center">
        <p className="text-sm text-muted">
          Header checksum included, no extra steps — apply your patch below and download a ROM
          that&apos;s ready to run.
        </p>
        <ButtonLink href="/" variant="primary" className="w-fit">
          Open the ROM Patcher
          <IconArrowRight className="h-4 w-4" />
        </ButtonLink>
      </div>

      <p className="text-xs text-muted">
        Deciding between formats? See{" "}
        <Link href="/patch-formats" className="text-accent-blue hover:underline">
          IPS, UPS, BPS, and xdelta compared
        </Link>
        .
      </p>
    </div>
  );
}
