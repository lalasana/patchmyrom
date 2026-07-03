import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import RelatedGuides from "@/components/ui/RelatedGuides";
import TroubleshootingCard from "@/components/ui/TroubleshootingCard";
import FaqAccordion from "@/components/ui/FaqAccordion";
import SectionHeading from "@/components/ui/SectionHeading";
import JsonLd from "@/components/seo/JsonLd";
import { ButtonLink } from "@/components/ui/Button";
import { FormatBadge } from "@/components/ui/FormatBadge";
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
  title: "BPS Patcher — Apply .bps ROM Patches in Your Browser",
  description:
    "Apply BPS patch files to a ROM locally, with automatic checksum verification so you know immediately if the base ROM is wrong.",
  path: "/bps-patcher",
});

const steps = [
  {
    title: "Line up your base ROM",
    body: "Check the hack's page for the exact game and revision it's built against. BPS will reject a mismatch rather than risk a broken patch.",
  },
  {
    title: "Grab the .bps file",
    body: "It's usually distributed as a single file next to the ROM hack's release notes.",
  },
  {
    title: "Select both in the patcher",
    body: "The format is read from the file header automatically — you don't need to tell it what it's looking at.",
  },
  {
    title: "Apply and download",
    body: "BPS verifies the output against its own recorded checksum before handing you the file, so a successful download means it's correct.",
  },
];

const mistakes = [
  {
    problem: "Ignoring the checksum-mismatch error",
    solution:
      "BPS rejects the wrong ROM on purpose — it's not a bug in the patcher. Track down the exact base ROM version the hack lists, not just \"the same game.\"",
    icon: <IconDatabase />,
  },
  {
    problem: "Mixing up which file is the ROM and which is the patch",
    solution:
      "The dropzones don't care about labels the way a human would — check that your original game file went into the ROM slot before applying.",
    icon: <IconAlertTriangle />,
  },
  {
    problem: "Expecting a BPS patch to work on a related but different game",
    solution:
      "BPS patches are built byte-for-byte against one source file. A patch made for one revision of a game won't apply to a different regional release.",
    icon: <IconLayers />,
  },
];

const troubleshooting = [
  {
    problem: "\"Invalid input ROM checksum\" error",
    solution:
      "This is BPS doing its job — the ROM you selected doesn't match what the patch was built against. Re-check the region, revision, and that the file isn't already modified.",
    icon: <IconDatabase />,
  },
  {
    problem: "Patch applies but the game won't boot",
    solution:
      "Rare with BPS since it checks both ends, but worth confirming the output extension matches what your emulator expects for that platform.",
    icon: <IconAlertTriangle />,
  },
  {
    problem: "Patch file itself won't load",
    solution:
      "Confirm the .bps file downloaded completely — a truncated download is the most common reason a patch file fails to parse at all.",
    icon: <IconInfo />,
  },
];

const faqItems = [
  {
    question: "What makes BPS different from IPS?",
    answer: "BPS stores a checksum of both the ROM it expects and the ROM it should produce. IPS has neither, so BPS can catch a wrong-ROM mistake before it does any damage.",
  },
  {
    question: "Does BPS support bigger ROMs than IPS?",
    answer: "Yes. IPS is capped around 16MB by its offset size. BPS doesn't share that limit, which is part of why larger, newer ROM hacks tend to prefer it.",
  },
  {
    question: "Why did my BPS patch get rejected immediately?",
    answer: "The checksum built into the patch didn't match your ROM. That almost always means a different region, revision, or a ROM that's already been altered.",
  },
  {
    question: "Can I trust that a completed BPS patch is correct?",
    answer: "BPS verifies its own output checksum as part of applying the patch, so a completed download has already passed that check — about as strong a guarantee as a patch format can give you.",
  },
];

export default function BpsPatcherPage() {
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Apply a BPS Patch",
    description: "Steps to apply a BPS patch file to a ROM using a browser-based patcher.",
    step: steps.map((step) => ({
      "@type": "HowToStep",
      name: step.title,
      text: step.body,
    })),
  };

  return (
    <div className="container-page flex flex-col gap-10 py-10 sm:py-14">
      <JsonLd data={howToJsonLd} />
      <Breadcrumbs items={[{ href: "/bps-patcher", label: "BPS Patcher" }]} />

      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">BPS Patcher</h1>
        <p className="max-w-2xl text-muted sm:text-lg">
          BPS patches carry their own checksum, so a bad match gets caught before it corrupts
          anything. Drop your ROM and .bps file in below — it applies entirely on your device.
        </p>
        <div>
          <FormatBadge format="BPS" />
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconShieldCheck />} title="Why Hack Creators Reach for BPS" accent="purple" />
        <div className="rounded-xl border-l-4 border-purple-500/40 bg-card/40 p-5">
          <p className="max-w-3xl text-muted">
            IPS never checked whether it was touching the right file. BPS was built specifically
            to fix that — it records a checksum for the source ROM and the finished result, so
            the patch itself can tell you when something doesn&apos;t line up. That&apos;s why it&apos;s become
            the go-to format for actively maintained ROM hacks that get updated often: creators
            would rather their patch fail loudly than silently hand someone a broken game.
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
            Patch a BPS file now
            <IconArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconAlertTriangle />} title="Mistakes That Trip Up BPS Patching" accent="amber" />
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
              href: "/patch-formats",
              title: "Patch Formats Explained",
              description: "IPS vs UPS vs BPS vs xdelta — which one do you need?",
            },
            {
              href: "/gba-rom-patcher",
              title: "GBA ROM Patcher",
              description: "BPS is a common choice for larger, modern GBA ROM hacks.",
            },
            {
              href: "/snes-rom-patcher",
              title: "SNES ROM Patcher",
              description: "Newer SNES translation projects increasingly ship as BPS.",
            },
          ]}
        />
      </section>

      <div className="card flex flex-col items-center gap-3 rounded-2xl p-6 text-center">
        <p className="text-sm text-muted">
          BPS checks its own work, but the patcher still runs entirely in your browser — nothing
          is uploaded either way.
        </p>
        <ButtonLink href="/" variant="primary" className="w-fit">
          Open the ROM Patcher
          <IconArrowRight className="h-4 w-4" />
        </ButtonLink>
      </div>

      <p className="text-xs text-muted">
        Not sure BPS is what you need? Compare it against{" "}
        <Link href="/patch-formats" className="text-accent-blue hover:underline">
          IPS, UPS, and xdelta
        </Link>
        .
      </p>
    </div>
  );
}
