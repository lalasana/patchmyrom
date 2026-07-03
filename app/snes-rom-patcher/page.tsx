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
  IconFileQuestion,
  IconArrowRight,
} from "@/components/ui/icons";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "SNES ROM Patcher — Patch SNES ROMs Online",
  description:
    "Apply IPS, UPS, or BPS patches to an SNES ROM in your browser, with automatic handling of the old copier header some dumps carry.",
  path: "/snes-rom-patcher",
});

const steps = [
  {
    title: "Start with your .sfc or .smc ROM",
    body: "Both extensions are common for SNES dumps and work the same way once loaded.",
  },
  {
    title: "Get the patch that matches your copy",
    body: "SNES hacks show up in IPS, UPS, or BPS depending on the project's age and size.",
  },
  {
    title: "Select both files",
    body: "The patcher figures out the format on its own, and handles a copier header automatically if one is present.",
  },
  {
    title: "Download the patched ROM",
    body: "The result is ready to load in any SNES emulator, header or no header.",
  },
];

const mistakes = [
  {
    problem: "Not knowing whether the ROM has a copier header",
    solution:
      "Some older SNES dumps carry an extra 512 bytes tacked onto the front from long-obsolete copier hardware. This patcher detects and handles it automatically, so there's usually nothing you need to do manually.",
    icon: <IconDatabase />,
  },
  {
    problem: "Applying a patch built for the opposite header state",
    solution:
      "A patch made for a headered ROM expects those extra 512 bytes; one made for a headerless dump doesn't. Getting this backwards is one of the more SNES-specific ways a patch can fail.",
    icon: <IconAlertTriangle />,
  },
  {
    problem: "Assuming IPS will catch a wrong-ROM mistake",
    solution:
      "Plenty of SNES hacks still use IPS, which has no verification built in. Newer projects using BPS will catch this for you; older IPS-based ones won't.",
    icon: <IconFileQuestion />,
  },
];

const troubleshooting = [
  {
    problem: "Patch fails or the game glitches out after a UPS/BPS patch",
    solution:
      "Check whether your ROM has a copier header the patch didn't expect, or vice versa. This is one of the most common SNES-specific causes of a checksum mismatch.",
    icon: <IconDatabase />,
  },
  {
    problem: "IPS patch applies but the game is broken",
    solution:
      "Since IPS can't verify the source ROM, this usually means a mismatched revision or region rather than a bad patch file.",
    icon: <IconAlertTriangle />,
  },
  {
    problem: "Output file size looks 512 bytes off from what you expected",
    solution:
      "That's the copier header being added or removed as part of patching — not an error, just the header state changing.",
    icon: <IconFileQuestion />,
  },
];

const faqItems = [
  {
    question: "What is a SNES copier header?",
    answer: "A 512-byte block some old SNES ROM dumps carry at the start of the file, left over from copier hardware used to transfer games decades ago. It has nothing to do with the game itself.",
  },
  {
    question: "Does this patcher handle the copier header for me?",
    answer: "Yes. It can detect a header on a supported SNES file extension and remove or reapply it as needed so the patch lines up correctly either way.",
  },
  {
    question: "Which patch format is most common for SNES hacks?",
    answer: "IPS historically, given how old the SNES hacking scene is. BPS has picked up ground more recently, particularly for larger or actively maintained projects.",
  },
  {
    question: "Why do some SNES ROMs end in .smc and others in .sfc?",
    answer: "Both are common container extensions for the same underlying SNES ROM data — the extension by itself doesn't tell you whether a copier header is present.",
  },
];

export default function SnesRomPatcherPage() {
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Patch an SNES ROM",
    description: "Steps to apply an IPS, UPS, or BPS patch to an SNES ROM using a browser-based patcher.",
    step: steps.map((step) => ({
      "@type": "HowToStep",
      name: step.title,
      text: step.body,
    })),
  };

  return (
    <div className="container-page flex flex-col gap-10 py-10 sm:py-14">
      <JsonLd data={howToJsonLd} />
      <Breadcrumbs items={[{ href: "/snes-rom-patcher", label: "SNES ROM Patcher" }]} />

      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">SNES ROM Patcher</h1>
        <p className="max-w-2xl text-muted sm:text-lg">
          SNES ROMs patch cleanly in most cases — the one thing to watch for is an old-style
          copier header, which this tool detects and handles for you.
        </p>
        <div className="flex gap-2">
          <FormatChip format="IPS" />
          <FormatChip format="UPS" />
          <FormatChip format="BPS" />
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconFileQuestion />} title="The Copier Header, Explained" accent="purple" />
        <div className="rounded-xl border-l-4 border-purple-500/40 bg-card/40 p-5">
          <p className="max-w-3xl text-muted">
            Decades ago, SNES copiers — hardware used to transfer games before flash carts existed
            — tacked an extra 512 bytes onto the front of a dump. Some ROM files still floating
            around today carry that header, some don&apos;t, and a patch built for one won&apos;t line up
            with the other. It&apos;s a small detail, but it&apos;s specific to this platform and it&apos;s the
            single most common reason a technically-correct SNES patch still fails.
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
            Patch an SNES ROM now
            <IconArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconAlertTriangle />} title="Mistakes That Trip Up SNES Patching" accent="amber" />
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
              description: "The classic format for SNES translation and hacking projects.",
            },
            {
              href: "/bps-patcher",
              title: "BPS Patcher",
              description: "The newer, checksum-verified choice for SNES hacks.",
            },
            {
              href: "/nes-rom-patcher",
              title: "NES ROM Patcher",
              description: "IPS's other classic home platform, from the same hacking era.",
            },
          ]}
        />
      </section>

      <div className="card flex flex-col items-center gap-3 rounded-2xl p-6 text-center">
        <p className="text-sm text-muted">
          Header or no header, the patcher below sorts it out — your ROM never leaves this
          browser tab.
        </p>
        <ButtonLink href="/" variant="primary" className="w-fit">
          Open the ROM Patcher
          <IconArrowRight className="h-4 w-4" />
        </ButtonLink>
      </div>

      <p className="text-xs text-muted">
        Not sure which patch format you have? See{" "}
        <Link href="/patch-formats" className="text-accent-blue hover:underline">
          IPS, UPS, BPS, and xdelta compared
        </Link>
        .
      </p>
    </div>
  );
}
