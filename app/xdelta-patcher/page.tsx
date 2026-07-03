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
  IconFileQuestion,
  IconArrowRight,
} from "@/components/ui/icons";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "xdelta Patcher — Apply .xdelta ROM Patches in Your Browser",
  description:
    "Apply xdelta/VCDIFF patches to large ROM files directly in your browser, including Nintendo DS games. No installs, nothing uploaded.",
  path: "/xdelta-patcher",
});

const steps = [
  {
    title: "Have your base ROM ready",
    body: "xdelta patches for something like an NDS game can mean waiting on a file that's tens or hundreds of megabytes — make sure you've got it before you start.",
  },
  {
    title: "Get the .xdelta patch file",
    body: "These are usually distributed as a single file. Double check it's meant for your exact ROM revision.",
  },
  {
    title: "Load both files into the patcher",
    body: "Large files take a moment to read — the tool shows real progress while it works through them.",
  },
  {
    title: "Download the result",
    body: "The patched ROM is assembled locally and offered as a normal download once it's done.",
  },
];

const mistakes = [
  {
    problem: "Expecting xdelta to be ROM-hacking-specific",
    solution:
      "It isn't — xdelta is a general binary diff tool the ROM hacking community adopted because it handles large files well. That also means it doesn't carry ROM-specific conventions the way IPS or BPS do.",
    icon: <IconInfo />,
  },
  {
    problem: "Using a differently-dumped copy of a large ROM",
    solution:
      "Two dumps of the same game can still differ by a few bytes depending on the tool that created them. For big NDS files especially, use the exact source the patch author mentions.",
    icon: <IconDatabase />,
  },
  {
    problem: "Assuming every .xdelta file behaves the same way",
    solution:
      "xdelta patches can optionally use secondary compression on top of the diff itself. Most ROM hacking patches don't, but it isn't guaranteed by the file extension alone.",
    icon: <IconFileQuestion />,
  },
];

const troubleshooting = [
  {
    problem: "Patch fails with a \"secondary decompressor\" or similar error",
    solution:
      "Some xdelta encoders can enable an extra compression pass on top of the base diff. Browser-based xdelta/VCDIFF decoders commonly support the plain, uncompressed form used by most ROM hacking patches, but not every optional variant. If this happens, check whether the hack offers a patch built without that option.",
    icon: <IconFileQuestion />,
  },
  {
    problem: "It's taking a long time with no visible progress",
    solution:
      "Large NDS ROMs can run from around 32MB up past 512MB. Reading and hashing a file that size takes real time in a browser — that's expected, not a sign it's stuck.",
    icon: <IconLayers />,
  },
  {
    problem: "Patch applies but the game doesn't boot",
    solution:
      "Confirm your source ROM byte-for-byte matches what the patch was built against — xdelta diffs are extremely sensitive to any difference in the input file.",
    icon: <IconAlertTriangle />,
  },
];

const faqItems = [
  {
    question: "Is xdelta a ROM hacking format like IPS or BPS?",
    answer: "No — xdelta is a general-purpose binary diff tool. The ROM hacking community adopted it because it copes well with very large files, not because it was designed for ROMs specifically.",
  },
  {
    question: "Why is xdelta used for Nintendo DS games specifically?",
    answer: "NDS ROMs run much larger than earlier handheld games, often tens to hundreds of megabytes. Formats built for smaller ROMs either can't address that much data or become impractically large as diffs.",
  },
  {
    question: "Why did my xdelta patch fail when others worked fine?",
    answer: "The most common cause is a base ROM that doesn't match exactly. A less common cause is a patch built with optional secondary compression that a particular decoder doesn't support.",
  },
  {
    question: "Does patching a huge ROM in a browser actually work?",
    answer: "Yes, though it takes longer than a small GBA or SNES file. The trade-off for staying entirely client-side is that your browser does the same work a desktop tool would.",
  },
];

export default function XdeltaPatcherPage() {
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Apply an xdelta Patch",
    description: "Steps to apply an xdelta (VCDIFF) patch file to a large ROM using a browser-based patcher.",
    step: steps.map((step) => ({
      "@type": "HowToStep",
      name: step.title,
      text: step.body,
    })),
  };

  return (
    <div className="container-page flex flex-col gap-10 py-10 sm:py-14">
      <JsonLd data={howToJsonLd} />
      <Breadcrumbs items={[{ href: "/xdelta-patcher", label: "xdelta Patcher" }]} />

      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">xdelta Patcher</h1>
        <p className="max-w-2xl text-muted sm:text-lg">
          xdelta handles the ROMs other formats weren&apos;t built for — mainly large Nintendo DS
          games. It runs here the same way everything else does: locally, in your browser.
        </p>
        <div>
          <FormatBadge format="XDelta" />
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconInfo />} title="A Tool Borrowed From Outside ROM Hacking" accent="amber" />
        <div className="rounded-xl border-l-4 border-amber-500/40 bg-card/40 p-5">
          <p className="max-w-3xl text-muted">
            Unlike IPS, UPS, or BPS, xdelta wasn&apos;t built for ROMs at all — it&apos;s a general binary
            diff format used well beyond gaming. The ROM hacking community picked it up because
            it scales to much bigger files without the diff itself becoming unreasonably large.
            That&apos;s exactly the situation Nintendo DS ROMs create: they&apos;re an order of magnitude
            bigger than the GBA and SNES games most other patch formats were designed around.
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
            Patch an xdelta file now
            <IconArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconAlertTriangle />} title="Mistakes That Trip Up xdelta Patching" accent="amber" />
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
              href: "/nds-rom-patcher",
              title: "NDS ROM Patcher",
              description: "xdelta is the dominant patch format for Nintendo DS ROM hacks.",
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
          Large file, same privacy guarantee — your ROM and patch stay on this device the whole
          time.
        </p>
        <ButtonLink href="/" variant="primary" className="w-fit">
          Open the ROM Patcher
          <IconArrowRight className="h-4 w-4" />
        </ButtonLink>
      </div>

      <p className="text-xs text-muted">
        New to patching in general? See{" "}
        <Link href="/patch-formats" className="text-accent-blue hover:underline">
          how xdelta compares to IPS, UPS, and BPS
        </Link>
        .
      </p>
    </div>
  );
}
