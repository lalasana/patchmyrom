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
  IconArrowRight,
} from "@/components/ui/icons";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "NES ROM Patcher — Patch NES ROMs Online",
  description:
    "Apply IPS patches to an NES ROM directly in your browser — the format that started ROM hacking in the first place.",
  path: "/nes-rom-patcher",
});

const steps = [
  {
    title: "Get a clean .nes ROM",
    body: "An unmodified dump of the original cartridge, without any header oddities from an unusual dumping tool.",
  },
  {
    title: "Download the .ips patch",
    body: "NES hacking has used IPS since long before most other formats existed, so this is what you'll almost always find.",
  },
  {
    title: "Load both into the patcher",
    body: "The format is detected from the patch file itself — no configuration needed.",
  },
  {
    title: "Download and play",
    body: "The result keeps the iNES header intact, so it loads normally in any NES emulator.",
  },
];

const mistakes = [
  {
    problem: "Using a ROM with a non-standard or stripped header",
    solution:
      "NES ROMs typically carry a small iNES header identifying the cartridge's mapper and layout. A ROM missing or altering that header can behave unpredictably once patched.",
    icon: <IconDatabase />,
  },
  {
    problem: "Applying a patch built for a different mapper or region",
    solution:
      "Two NES cartridges of \"the same game\" sometimes used different hardware mappers between regions. Match the patch to the exact version it lists.",
    icon: <IconAlertTriangle />,
  },
  {
    problem: "Expecting the patch to flag a wrong ROM",
    solution:
      "IPS has no built-in verification. If the base ROM is wrong, the patch will still apply — just incorrectly.",
    icon: <IconLayers />,
  },
];

const troubleshooting = [
  {
    problem: "Screen is garbled or the game resets constantly",
    solution:
      "A classic sign the base ROM didn't match the patch. Since IPS can't verify this beforehand, check the exact revision and mapper the hack expects.",
    icon: <IconMonitorX />,
  },
  {
    problem: "Emulator doesn't recognize the patched file at all",
    solution:
      "Confirm the file still starts with a valid iNES header — some tools strip or rewrite it unexpectedly when handling older ROM formats.",
    icon: <IconDatabase />,
  },
  {
    problem: "Patch applies cleanly but graphics are missing",
    solution:
      "That points to a mapper mismatch rather than a patching failure — the ROM's hardware bank layout doesn't match what the hack assumes.",
    icon: <IconAlertTriangle />,
  },
];

const faqItems = [
  {
    question: "Why is IPS so tied to NES specifically?",
    answer: "IPS was created during the earliest era of ROM hacking, when NES and SNES translation projects were some of the only ones happening. It's stuck around ever since as the format's home turf.",
  },
  {
    question: "What is the iNES header?",
    answer: "A short block at the start of most NES ROM files that describes the cartridge's mapper and memory layout. Patchers and emulators both read it to know how to handle the rest of the file.",
  },
  {
    question: "Does patch size matter for NES ROMs?",
    answer: "Rarely — NES ROMs are small by nearly any modern patch format's standards, so size limits that matter on bigger platforms don't come up here.",
  },
  {
    question: "Can I patch an NES ROM without deleting my emulator save?",
    answer: "Patching only changes the game file itself. Save data tied to your emulator is stored separately and isn't affected by applying a patch.",
  },
];

export default function NesRomPatcherPage() {
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Patch an NES ROM",
    description: "Steps to apply an IPS patch to an NES ROM using a browser-based patcher.",
    step: steps.map((step) => ({
      "@type": "HowToStep",
      name: step.title,
      text: step.body,
    })),
  };

  return (
    <div className="container-page flex flex-col gap-10 py-10 sm:py-14">
      <JsonLd data={howToJsonLd} />
      <Breadcrumbs items={[{ href: "/nes-rom-patcher", label: "NES ROM Patcher" }]} />

      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">NES ROM Patcher</h1>
        <p className="max-w-2xl text-muted sm:text-lg">
          NES ROM hacking is where IPS came from in the first place. This tool applies those
          patches the same way it handles everything newer — locally, in your browser.
        </p>
        <div>
          <FormatChip format="IPS" />
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconInfo />} title="The Format That Started It All" accent="green" />
        <div className="rounded-xl border-l-4 border-accent-green/40 bg-card/40 p-5">
          <p className="max-w-3xl text-muted">
            Long before Game Boy Advance or Nintendo DS hacking existed, NES and SNES translation
            groups needed a way to share their work without redistributing copyrighted ROMs. IPS
            was the answer, and NES hacking has stayed close to it ever since. Most NES ROMs are
            small enough that IPS&apos;s size ceiling never becomes a practical issue, so there&apos;s
            rarely a reason for a project to move to anything newer.
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
            Patch an NES ROM now
            <IconArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconAlertTriangle />} title="Mistakes That Trip Up NES Patching" accent="amber" />
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
              description: "A closer look at the format behind almost every NES patch.",
            },
            {
              href: "/snes-rom-patcher",
              title: "SNES ROM Patcher",
              description: "IPS's other classic home platform, from the same hacking era.",
            },
            {
              href: "/troubleshooting",
              title: "Troubleshooting",
              description: "Fix common ROM patching errors and mismatches.",
            },
          ]}
        />
      </section>

      <div className="card flex flex-col items-center gap-3 rounded-2xl p-6 text-center">
        <p className="text-sm text-muted">
          Old format, same modern privacy guarantee — your ROM and patch stay on this device.
        </p>
        <ButtonLink href="/" variant="primary" className="w-fit">
          Open the ROM Patcher
          <IconArrowRight className="h-4 w-4" />
        </ButtonLink>
      </div>

      <p className="text-xs text-muted">
        Want more detail on the format itself? See the{" "}
        <Link href="/ips-patcher" className="text-accent-blue hover:underline">
          IPS patcher guide
        </Link>
        .
      </p>
    </div>
  );
}
