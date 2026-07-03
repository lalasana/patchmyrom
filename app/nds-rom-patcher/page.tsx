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
  IconBolt,
  IconArrowRight,
} from "@/components/ui/icons";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "NDS ROM Patcher — Patch Nintendo DS ROMs Online",
  description:
    "Apply xdelta patches to Nintendo DS ROMs directly in your browser, with real progress on large files. Nothing is uploaded.",
  path: "/nds-rom-patcher",
});

const steps = [
  {
    title: "Locate your .nds ROM",
    body: "DS games run much larger than earlier handheld ROMs — expect anywhere from around 32MB up to several hundred megabytes depending on the game.",
  },
  {
    title: "Download the matching patch",
    body: "Almost always distributed as a single .xdelta file built against one specific ROM dump.",
  },
  {
    title: "Load both into the patcher",
    body: "Reading a large file takes longer than a small one — you'll see real read progress rather than a frozen page.",
  },
  {
    title: "Download the finished ROM",
    body: "Once applied, the result is ready to load in any DS-compatible emulator or flashcart tool.",
  },
];

const mistakes = [
  {
    problem: "Not budgeting time for a large file",
    solution:
      "A 200MB+ ROM takes noticeably longer to read and hash than a 16MB GBA file. That's the file size talking, not a broken tool.",
    icon: <IconBolt />,
  },
  {
    problem: "Using a dump from a different source than the patch expects",
    solution:
      "Two dumps of the same DS game can differ slightly depending on how they were extracted. Match the exact source the patch author recommends.",
    icon: <IconDatabase />,
  },
  {
    problem: "Closing the tab mid-patch on a slower device",
    solution:
      "Large files mean more work for your browser to do. Give it a moment to finish, especially on older phones or laptops.",
    icon: <IconAlertTriangle />,
  },
];

const troubleshooting = [
  {
    problem: "The page feels unresponsive while reading a big ROM",
    solution:
      "Reading and hashing a multi-hundred-megabyte file takes real time. The patcher reports progress as it goes rather than locking up silently.",
    icon: <IconBolt />,
  },
  {
    problem: "Patch fails right away",
    solution:
      "Confirm the ROM is the exact dump the patch targets. DS ROMs don't tolerate the small differences between dumping tools as gracefully as some smaller formats.",
    icon: <IconDatabase />,
  },
  {
    problem: "Patch applies but the game won't load on a flashcart",
    solution:
      "That's usually a flashcart firmware or file-naming issue rather than a patching problem — worth checking your flashcart's own documentation.",
    icon: <IconAlertTriangle />,
  },
];

const faqItems = [
  {
    question: "Why are Nintendo DS ROMs so much bigger than GBA ones?",
    answer: "The DS supports dual screens, 3D graphics, and generally richer games, which all demand more storage. That's also why DS ROM hacks lean on xdelta instead of older, smaller-scale patch formats.",
  },
  {
    question: "Can a browser really patch a 300MB+ ROM?",
    answer: "Yes — it just takes longer than a small file would. The trade-off for staying entirely on-device is that your browser does the same work a desktop patching tool would do.",
  },
  {
    question: "What patch format do NDS ROM hacks use?",
    answer: "Almost always xdelta. It handles large binary diffs well, which matters a lot once files reach DS-scale sizes.",
  },
  {
    question: "Do I need a specific emulator for a patched DS ROM?",
    answer: "Any emulator or flashcart that runs the original game should run the patched version, since patching only changes the ROM's contents, not its format.",
  },
];

export default function NdsRomPatcherPage() {
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Patch a Nintendo DS ROM",
    description: "Steps to apply an xdelta patch to a Nintendo DS ROM using a browser-based patcher.",
    step: steps.map((step) => ({
      "@type": "HowToStep",
      name: step.title,
      text: step.body,
    })),
  };

  return (
    <div className="container-page flex flex-col gap-10 py-10 sm:py-14">
      <JsonLd data={howToJsonLd} />
      <Breadcrumbs items={[{ href: "/nds-rom-patcher", label: "NDS ROM Patcher" }]} />

      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">NDS ROM Patcher</h1>
        <p className="max-w-2xl text-muted sm:text-lg">
          Nintendo DS ROMs run much larger than earlier handheld games. This patcher is built to
          handle that size locally, with real progress instead of a frozen page.
        </p>
        <div>
          <FormatChip format="XDelta" />
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconBolt />} title="Patching at DS Scale" accent="purple" />
        <div className="rounded-xl border-l-4 border-purple-500/40 bg-card/40 p-5">
          <p className="max-w-3xl text-muted">
            A DS ROM can be ten or twenty times the size of a typical GBA game. That changes what
            patching actually involves — instead of a near-instant operation, reading and
            verifying the file becomes the slowest part of the process. This patcher reads large
            ROMs in chunks and shows genuine progress the whole way through, rather than leaving
            the page looking stuck while it works.
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
            Patch an NDS ROM now
            <IconArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconAlertTriangle />} title="Mistakes That Trip Up NDS Patching" accent="amber" />
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
              href: "/xdelta-patcher",
              title: "xdelta Patcher",
              description: "A closer look at the format behind most NDS ROM hack patches.",
            },
            {
              href: "/troubleshooting",
              title: "Troubleshooting",
              description: "Fix common ROM patching errors and mismatches.",
            },
            {
              href: "/gba-rom-patcher",
              title: "GBA ROM Patcher",
              description: "For smaller handheld ROMs using IPS, UPS, or BPS.",
            },
          ]}
        />
      </section>

      <div className="card flex flex-col items-center gap-3 rounded-2xl p-6 text-center">
        <p className="text-sm text-muted">
          Big file, same guarantee — it never leaves your device, patched entirely in this
          browser tab.
        </p>
        <ButtonLink href="/" variant="primary" className="w-fit">
          Open the ROM Patcher
          <IconArrowRight className="h-4 w-4" />
        </ButtonLink>
      </div>

      <p className="text-xs text-muted">
        Curious how xdelta actually works? See the{" "}
        <Link href="/xdelta-patcher" className="text-accent-blue hover:underline">
          xdelta patcher guide
        </Link>
        .
      </p>
    </div>
  );
}
