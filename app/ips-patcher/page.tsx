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
  IconMonitorX,
  IconFileQuestion,
  IconArrowRight,
} from "@/components/ui/icons";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "IPS Patcher — Apply .ips ROM Patches in Your Browser",
  description:
    "Apply IPS patch files to a ROM directly in your browser. No installs, no command line — just the ROM, the .ips file, and a download.",
  path: "/ips-patcher",
});

const steps = [
  {
    title: "Get a clean base ROM",
    body: "IPS patches are built against one exact ROM file. A ROM that's already been trained, randomized, or patched with something else won't work.",
  },
  {
    title: "Download the .ips file",
    body: "Get it from the hack's official page. IPS patches are small — usually a few kilobytes to a couple of megabytes.",
  },
  {
    title: "Open the patcher and select both files",
    body: "Drop in your ROM and the .ips patch. The format is detected automatically from the file header, so there's nothing to configure.",
  },
  {
    title: "Download the patched ROM",
    body: "The output is generated locally and named after your original file. Load it straight into your emulator.",
  },
];

const mistakes = [
  {
    problem: "Patching a ROM that's already modified",
    solution:
      "Cheats, previous patches, or randomizer output all change the underlying bytes IPS expects. Start from an untouched backup every time.",
    icon: <IconAlertTriangle />,
  },
  {
    problem: "Assuming a silent success means it worked",
    solution:
      "IPS has no way to verify it's touching the right file. If the output looks wrong, the ROM was wrong — not the patcher.",
    icon: <IconDatabase />,
  },
  {
    problem: "Using a ROM larger than IPS can address",
    solution:
      "IPS offsets are 3 bytes wide, capping addressable space at 16MB. Some later, larger hacks moved to BPS specifically to avoid this.",
    icon: <IconFileQuestion />,
  },
];

const troubleshooting = [
  {
    problem: "Graphics are garbled or the game won't boot",
    solution:
      "This is the classic sign of a wrong-ROM IPS patch. Since IPS can't check checksums, it happily overwrites bytes at the wrong offsets. Re-check the exact ROM revision the patch expects.",
    icon: <IconMonitorX />,
  },
  {
    problem: "The patched file is identical to the original",
    solution:
      "Usually means the patch was applied to a copy that didn't match at all, and the patcher's underlying logic rejected changes silently in an emulator-specific way, or the wrong file was selected as the ROM.",
    icon: <IconAlertTriangle />,
  },
  {
    problem: "\"ROM too large\" type errors",
    solution:
      "IPS can't address past 16MB. If your base ROM is unusually large for its platform, confirm you're not accidentally using a padded or header-attached dump.",
    icon: <IconDatabase />,
  },
];

const faqItems = [
  {
    question: "What does IPS actually stand for?",
    answer: "International Patching System. It dates back to the early SNES fan-translation scene and became the de facto standard long before any formal spec existed.",
  },
  {
    question: "Is IPS still used for new ROM hacks?",
    answer: "Yes, especially for smaller projects and older platforms. Larger, actively developed hacks increasingly move to BPS once they outgrow IPS's size limit or want built-in verification.",
  },
  {
    question: "Why doesn't the patcher warn me if I pick the wrong ROM?",
    answer: "IPS never had checksum verification designed into it. There's no field in the format that records what ROM it expects, so nothing can cross-check it before applying.",
  },
  {
    question: "Can IPS patch large ROMs like NDS games?",
    answer: "No. Its 3-byte offsets top out at 16MB, which rules out anything from the DS era onward. Those platforms use xdelta instead.",
  },
];

export default function IpsPatcherPage() {
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Apply an IPS Patch",
    description: "Steps to apply an IPS patch file to a ROM using a browser-based patcher.",
    step: steps.map((step) => ({
      "@type": "HowToStep",
      name: step.title,
      text: step.body,
    })),
  };

  return (
    <div className="container-page flex flex-col gap-10 py-10 sm:py-14">
      <JsonLd data={howToJsonLd} />
      <Breadcrumbs items={[{ href: "/ips-patcher", label: "IPS Patcher" }]} />

      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">IPS Patcher</h1>
        <p className="max-w-2xl text-muted sm:text-lg">
          IPS is the oldest patch format still in everyday use. If your file ends in{" "}
          <code className="text-foreground">.ips</code>, this tool applies it locally — no
          installer, no command line.
        </p>
        <div>
          <FormatBadge format="IPS" />
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconInfo />} title="Where IPS Still Shows Up" accent="green" />
        <div className="rounded-xl border-l-4 border-accent-green/40 bg-card/40 p-5">
          <p className="max-w-3xl text-muted">
            IPS predates almost every other patch format in this space, and it&apos;s still the
            default output for a lot of hacking tools simply because it&apos;s easy to implement.
            You&apos;ll run into it most on SNES, NES, and Game Boy projects, plus smaller GBA hacks
            that never grew past its size ceiling. Bigger, actively updated hacks tend to move on
            once they need more space or want the patch to verify itself.
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
            Patch an IPS file now
            <IconArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconAlertTriangle />} title="Mistakes That Break IPS Patches" accent="amber" />
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
              href: "/patch-formats",
              title: "Patch Formats Explained",
              description: "IPS vs UPS vs BPS vs xdelta — which one do you need?",
            },
            {
              href: "/gba-rom-patcher",
              title: "GBA ROM Patcher",
              description: "Patch Game Boy Advance ROMs — IPS, UPS, and BPS all apply here.",
            },
            {
              href: "/snes-rom-patcher",
              title: "SNES ROM Patcher",
              description: "IPS is still the most common format for SNES translation patches.",
            },
          ]}
        />
      </section>

      <div className="card flex flex-col items-center gap-3 rounded-2xl p-6 text-center">
        <p className="text-sm text-muted">
          Got a ROM and an .ips file ready? Nothing leaves your device — the patch runs entirely
          in this browser tab.
        </p>
        <ButtonLink href="/" variant="primary" className="w-fit">
          Open the ROM Patcher
          <IconArrowRight className="h-4 w-4" />
        </ButtonLink>
      </div>

      <p className="text-xs text-muted">
        Looking for the full picture? See{" "}
        <Link href="/patch-formats" className="text-accent-blue hover:underline">
          how IPS compares to UPS, BPS, and xdelta
        </Link>
        .
      </p>
    </div>
  );
}
