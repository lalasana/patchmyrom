import type { Metadata } from "next";
import Link from "next/link";
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
  IconMonitorX,
  IconCartridge,
  IconArrowRight,
} from "@/components/ui/icons";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "GBA ROM Patcher — Patch Game Boy Advance ROMs Online",
  description:
    "Apply IPS, UPS, or BPS patches to a Game Boy Advance ROM directly in your browser. No installs, nothing uploaded.",
  path: "/gba-rom-patcher",
});

const steps = [
  {
    title: "Start with a clean .gba file",
    body: "Your own legally-dumped backup, unmodified by cheats, trainers, or a previous patch attempt.",
  },
  {
    title: "Get the patch that matches it",
    body: "Check the hack's page for the required region and revision before downloading anything.",
  },
  {
    title: "Select both files below",
    body: "The patcher reads the patch format automatically, whether it's IPS, UPS, or BPS.",
  },
  {
    title: "Download and load it up",
    body: "The output keeps the .gba extension so it drops straight into any GBA-compatible emulator.",
  },
];

const mistakes = [
  {
    problem: "Not checking the ROM revision first",
    solution:
      "GBA games often had multiple regional releases with slightly different data. A patch built for one revision can fail or misbehave on another.",
    icon: <IconDatabase />,
  },
  {
    problem: "Patching a ROM with an existing header or trainer attached",
    solution:
      "Some GBA dumps pick up extra bytes from the tool that created them. Start from a plain, unmodified dump whenever possible.",
    icon: <IconAlertTriangle />,
  },
  {
    problem: "Mixing up patch formats between hacks",
    solution:
      "GBA hacks show up in IPS, UPS, and BPS depending on when and by whom they were made — the patcher detects this for you, so there's no need to guess.",
    icon: <IconLayers />,
  },
];

const troubleshooting = [
  {
    problem: "Emulator shows a black or white screen after patching",
    solution:
      "Usually a base ROM mismatch. Re-check the exact region and revision the patch's documentation lists, not just the game title.",
    icon: <IconMonitorX />,
  },
  {
    problem: "Patch is rejected before it even applies",
    solution:
      "If the format is UPS or BPS, this means the checksum built into the patch doesn't match your file — a strong signal you have the wrong ROM version.",
    icon: <IconDatabase />,
  },
  {
    problem: "Patched file plays but looks or sounds wrong",
    solution:
      "That's typically a hack-content issue once the patch has applied successfully — worth checking the project's own known-issues list.",
    icon: <IconAlertTriangle />,
  },
];

const faqItems = [
  {
    question: "Which patch formats do GBA ROM hacks use?",
    answer: "All three of the common ones — IPS, UPS, and BPS — show up regularly. Older or smaller hacks lean IPS; newer or larger ones increasingly use BPS.",
  },
  {
    question: "Do GBA ROMs need a header removed before patching?",
    answer: "Not typically. GBA dumps are usually header-free by default, unlike some older cartridge-based systems that used copier headers.",
  },
  {
    question: "Why are there so many GBA ROM hacks compared to other consoles?",
    answer: "The GBA's ROM size and hardware struck a balance that made it approachable for hobbyist development tools, and that drew a large, long-running hacking community.",
  },
  {
    question: "Can I patch a GBA ROM on my phone?",
    answer: "Yes — since patching happens in the browser itself, it works on mobile browsers the same way it does on desktop.",
  },
];

export default function GbaRomPatcherPage() {
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Patch a GBA ROM",
    description: "Steps to apply an IPS, UPS, or BPS patch to a Game Boy Advance ROM using a browser-based patcher.",
    step: steps.map((step) => ({
      "@type": "HowToStep",
      name: step.title,
      text: step.body,
    })),
  };

  return (
    <div className="container-page flex flex-col gap-10 py-10 sm:py-14">
      <JsonLd data={howToJsonLd} />
      <Breadcrumbs items={[{ href: "/gba-rom-patcher", label: "GBA ROM Patcher" }]} />

      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">GBA ROM Patcher</h1>
        <p className="max-w-2xl text-muted sm:text-lg">
          Game Boy Advance ROMs make up the largest share of ROM hacking activity out there. This
          patcher handles the formats they typically ship in, entirely in your browser.
        </p>
        <div className="flex gap-2">
          <FormatChip format="IPS" />
          <FormatChip format="UPS" />
          <FormatChip format="BPS" />
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconCartridge />} title="Why GBA Dominates ROM Hacking" accent="green" />
        <div className="rounded-xl border-l-4 border-accent-green/40 bg-card/40 p-5">
          <p className="max-w-3xl text-muted">
            The Game Boy Advance sits in a comfortable middle ground: ROMs are large enough to
            support ambitious new content, but small enough that early, hobbyist hacking tools
            could actually work with them. That combination built one of the biggest and
            longest-running ROM hacking communities of any console, and it&apos;s still where a huge
            share of new hacks get released.
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
            Patch a GBA ROM now
            <IconArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconAlertTriangle />} title="Mistakes That Trip Up GBA Patching" accent="amber" />
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
        <SectionHeading icon={<IconMonitorX />} title="Troubleshooting" accent="amber" />
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
              description: "The oldest, simplest format — still common for GBA hacks.",
            },
            {
              href: "/bps-patcher",
              title: "BPS Patcher",
              description: "Checksum-verified patching, popular for newer GBA hacks.",
            },
            {
              href: "/pokemon-rom-patcher",
              title: "Pokemon ROM Patcher",
              description: "Base ROM reference for 50 popular GBA-era Pokemon ROM hacks.",
            },
          ]}
        />
      </section>

      <div className="card flex flex-col items-center gap-3 rounded-2xl p-6 text-center">
        <p className="text-sm text-muted">
          Ready when you are — the patcher below reads GBA ROMs and IPS/UPS/BPS patches without
          any setup.
        </p>
        <ButtonLink href="/" variant="primary" className="w-fit">
          Open the ROM Patcher
          <IconArrowRight className="h-4 w-4" />
        </ButtonLink>
      </div>

      <p className="text-xs text-muted">
        Not sure which format your patch is? See{" "}
        <Link href="/patch-formats" className="text-accent-blue hover:underline">
          how IPS, UPS, and BPS compare
        </Link>
        .
      </p>
    </div>
  );
}
