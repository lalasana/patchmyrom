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
  IconGamepad,
  IconArrowRight,
} from "@/components/ui/icons";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "UPS Patcher — Apply .ups ROM Patches in Your Browser",
  description:
    "Apply UPS patch files to a ROM in your browser. UPS checks both the source and result against a stored checksum before it will apply.",
  path: "/ups-patcher",
});

const steps = [
  {
    title: "Confirm the exact ROM the patch wants",
    body: "Fan translation groups are usually specific about region and version — UPS won't apply if it doesn't match.",
  },
  {
    title: "Download the .ups patch",
    body: "These are typically listed right next to the project's release notes or on the group's own site.",
  },
  {
    title: "Select the ROM and the patch",
    body: "Auto-detection reads the UPS header, so you don't need to pick a format manually.",
  },
  {
    title: "Download your patched ROM",
    body: "UPS checks the result's checksum before finishing, so a successful download has already been verified.",
  },
];

const mistakes = [
  {
    problem: "Assuming any copy of the game will work",
    solution:
      "UPS patches are tied to one specific dump. A different revision, region dump, or even a re-dumped copy with different padding can fail the checksum check.",
    icon: <IconDatabase />,
  },
  {
    problem: "Re-patching an already-patched ROM",
    solution:
      "If you're updating to a newer patch version, start over from a clean backup rather than patching on top of the old result.",
    icon: <IconAlertTriangle />,
  },
  {
    problem: "Losing track of which ROM revision you have",
    solution:
      "Keep your original download's filename intact until you know it's the right one — renaming it won't change the header, but it makes mismatches harder to spot.",
    icon: <IconLayers />,
  },
];

const troubleshooting = [
  {
    problem: "Patch is rejected instantly",
    solution:
      "UPS checked the ROM's checksum before doing anything and it didn't match. Go back to the source and confirm the exact release the patch targets.",
    icon: <IconDatabase />,
  },
  {
    problem: "Output size looks different than expected",
    solution:
      "Some UPS patches intentionally expand a ROM (adding new areas or assets). If the source and target sizes differ, that's usually by design, not an error.",
    icon: <IconLayers />,
  },
  {
    problem: "Patch works but text or graphics look broken",
    solution:
      "That's a hack-content issue rather than a patching issue — the file applied correctly, so check the project's own known-issues notes.",
    icon: <IconAlertTriangle />,
  },
];

const faqItems = [
  {
    question: "How is UPS different from BPS?",
    answer: "Functionally similar — both check a checksum before applying. UPS came first and is still common in translation circles; BPS came later with a more efficient diff and no practical size limit.",
  },
  {
    question: "Why does UPS reject my ROM without explanation?",
    answer: "It checks the exact checksum of the ROM it expects before touching anything. Any difference — region, revision, or a modified file — fails that check on purpose.",
  },
  {
    question: "Is UPS only used for translations?",
    answer: "It's especially common there, but it's a general-purpose format — plenty of gameplay-focused ROM hacks use it too, particularly older SNES and GBA projects.",
  },
  {
    question: "Can a UPS patch make my ROM bigger?",
    answer: "Yes, if the patch's author built it that way. The format stores both the expected input size and the resulting output size, so growth isn't unusual.",
  },
];

export default function UpsPatcherPage() {
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Apply a UPS Patch",
    description: "Steps to apply a UPS patch file to a ROM using a browser-based patcher.",
    step: steps.map((step) => ({
      "@type": "HowToStep",
      name: step.title,
      text: step.body,
    })),
  };

  return (
    <div className="container-page flex flex-col gap-10 py-10 sm:py-14">
      <JsonLd data={howToJsonLd} />
      <Breadcrumbs items={[{ href: "/ups-patcher", label: "UPS Patcher" }]} />

      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">UPS Patcher</h1>
        <p className="max-w-2xl text-muted sm:text-lg">
          UPS won&apos;t apply unless your ROM matches exactly. That strictness is the point — it
          exists to stop a patch from landing on the wrong file.
        </p>
        <div>
          <FormatBadge format="UPS" />
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconGamepad />} title="Where You'll Run Into UPS" accent="blue" />
        <div className="rounded-xl border-l-4 border-accent-blue/40 bg-card/40 p-5">
          <p className="max-w-3xl text-muted">
            UPS grew out of the fan translation community, where getting the exact base ROM
            right matters more than almost anywhere else — a mistranslated header or an off-by-one
            revision can wreck a project&apos;s reputation. It carries that same discipline into general
            ROM hacking: SNES and GBA hacks from groups who came out of the translation scene
            still favor it, even when the patch has nothing to do with a translation at all.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconLayers />} title="Step-by-Step" accent="green" />
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
            Patch a UPS file now
            <IconArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconAlertTriangle />} title="Mistakes That Trip Up UPS Patching" accent="amber" />
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
              href: "/gbc-rom-patcher",
              title: "GBC ROM Patcher",
              description: "UPS is a frequent choice for Game Boy Color era patches.",
            },
            {
              href: "/gba-rom-patcher",
              title: "GBA ROM Patcher",
              description: "Many GBA translation and hacking projects still ship as UPS.",
            },
          ]}
        />
      </section>

      <div className="card flex flex-col items-center gap-3 rounded-2xl p-6 text-center">
        <p className="text-sm text-muted">
          Have the right ROM and a .ups file ready? Everything below happens on your device, not
          on a server.
        </p>
        <ButtonLink href="/" variant="primary" className="w-fit">
          Open the ROM Patcher
          <IconArrowRight className="h-4 w-4" />
        </ButtonLink>
      </div>

      <p className="text-xs text-muted">
        Want the bigger picture first? Compare UPS against{" "}
        <Link href="/patch-formats" className="text-accent-blue hover:underline">
          IPS, BPS, and xdelta
        </Link>
        .
      </p>
    </div>
  );
}
