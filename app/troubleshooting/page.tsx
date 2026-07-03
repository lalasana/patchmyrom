import type { Metadata } from "next";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import TroubleshootingCard from "@/components/ui/TroubleshootingCard";
import FaqAccordion from "@/components/ui/FaqAccordion";
import RelatedGuides from "@/components/ui/RelatedGuides";
import SectionHeading from "@/components/ui/SectionHeading";
import {
  IconAlertTriangle,
  IconDatabase,
  IconFileQuestion,
  IconMonitorX,
  IconLayers,
  IconInfo,
} from "@/components/ui/icons";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "ROM Patching Troubleshooting — Common Errors & Fixes",
  description:
    "Fix common ROM patching errors including checksum mismatches, wrong ROM versions, and patches that won't apply.",
  path: "/troubleshooting",
});

const issues = [
  {
    problem: "\"Patch does not match this ROM\" error",
    solution:
      "Your base ROM revision (region, version 1.0/1.1, headered/unheadered) doesn't match what the patch expects. Check the patch's documentation for the exact required ROM.",
    icon: <IconAlertTriangle />,
  },
  {
    problem: "Patched file won't open in an emulator",
    solution:
      "Make sure the output file extension matches your emulator's expectations (.gba, .nds, .sfc, .z64) and that the original ROM file wasn't already modified or corrupted.",
    icon: <IconMonitorX />,
  },
  {
    problem: "Checksum or header mismatch",
    solution:
      "Some patches expect a headerless ROM, others expect a 512-byte header. Try toggling this on your base ROM if patching fails.",
    icon: <IconDatabase />,
  },
  {
    problem: "Patch file won't load / is rejected",
    solution:
      "Confirm the patch file wasn't corrupted during download and that its extension (.ips, .ups, .bps, .xdelta) matches its actual format.",
    icon: <IconFileQuestion />,
  },
  {
    problem: "Game crashes after patching",
    solution:
      "This usually indicates a base ROM mismatch rather than a patcher issue. Re-download both the ROM and the patch and verify the required version again.",
    icon: <IconAlertTriangle />,
  },
  {
    problem: "Patched ROM is the wrong file size",
    solution:
      "Some patch formats expand the ROM (e.g. BPS supports different source/target sizes). This is expected for many hacks — check the hack's release notes.",
    icon: <IconLayers />,
  },
];

const faqItems = [
  {
    question: "Why does my patch fail with a checksum error?",
    answer:
      "UPS and BPS patches embed a checksum of the expected base ROM. If your ROM doesn't match exactly (region, revision, header), the checksum check fails and the patch is rejected on purpose to prevent corruption.",
  },
  {
    question: "Can I patch a ROM that's already been patched?",
    answer:
      "Generally no — double-patching or patching an already-modified ROM will almost always fail or produce a broken file. Always start from a clean, original backup.",
  },
];

export default function TroubleshootingPage() {
  return (
    <div className="container-page flex flex-col gap-10 py-10 sm:py-14">
      <Breadcrumbs items={[{ href: "/troubleshooting", label: "Troubleshooting" }]} />

      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Troubleshooting</h1>
        <p className="max-w-2xl text-muted sm:text-lg">
          Common ROM patching problems and how to fix them.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconAlertTriangle />} title="Common Issues" accent="amber" />
        <div className="grid gap-4 sm:grid-cols-2">
          {issues.map((issue) => (
            <TroubleshootingCard
              key={issue.problem}
              problem={issue.problem}
              solution={issue.solution}
              icon={issue.icon}
            />
          ))}
        </div>
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
              href: "/pokemon-rom-patcher",
              title: "Pokemon ROM Patcher",
              description: "Base ROM and format reference for 50 popular Pokemon ROM hacks.",
            },
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
          ]}
        />
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconInfo />} title="FAQ" accent="blue" />
        <FaqAccordion items={faqItems} />
      </section>
    </div>
  );
}
