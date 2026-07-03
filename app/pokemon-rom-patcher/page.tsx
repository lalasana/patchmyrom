import type { Metadata } from "next";
import Link from "next/link";
import RomPatcherTool from "@/components/tool/RomPatcherTool";
import PrivacyNote from "@/components/ui/PrivacyNote";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import FaqAccordion from "@/components/ui/FaqAccordion";
import RelatedGuides from "@/components/ui/RelatedGuides";
import SectionHeading from "@/components/ui/SectionHeading";
import BackgroundGlow from "@/components/ui/BackgroundGlow";
import TroubleshootingCard from "@/components/ui/TroubleshootingCard";
import PokemonHackBaseRomTable from "@/components/content/PokemonHackBaseRomTable";
import JsonLd from "@/components/seo/JsonLd";
import { ButtonLink } from "@/components/ui/Button";
import {
  IconGamepad,
  IconInfo,
  IconLayers,
  IconAlertTriangle,
  IconDatabase,
  IconFileQuestion,
  IconMonitorX,
  IconArrowRight,
} from "@/components/ui/icons";
import { siteConfig } from "@/lib/site";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Pokemon ROM Patcher — Patch Pokemon ROM Hacks Locally",
  description:
    "Patch Pokemon ROM hacks (IPS, UPS, BPS) directly in your browser, plus a base ROM reference for 50 popular hacks like Radical Red, Unbound, and Gaia.",
  path: "/pokemon-rom-patcher",
});

const faqItems = [
  {
    question: "What base ROM do I need for Pokemon ROM hacks?",
    answer:
      "It depends on the hack. Most GBA-era hacks are built on FireRed, LeafGreen, Ruby, or Emerald, while GBC hacks usually need Gold, Silver, or Crystal, and NDS hacks need Platinum, HeartGold, SoulSilver, Black, or White. Check the table above for 50 popular hacks and their required base game.",
  },
  {
    question: "Why does a Pokemon ROM patch fail?",
    answer:
      "The most common cause is using the wrong base ROM — a different region, revision (like 1.0 vs 1.1), or a ROM that's already been modified. Patch formats like UPS and BPS include a checksum that intentionally rejects a mismatched base ROM rather than risk corrupting it.",
  },
  {
    question: "What is the base ROM for Pokemon Radical Red?",
    answer:
      "Pokemon Radical Red is built on Pokemon FireRed, typically requiring a clean 1.0 (USA) ROM. Always confirm against the official patch page, since required versions can change between updates.",
  },
  {
    question: "What is the base ROM for Pokemon Unbound?",
    answer:
      "Pokemon Unbound is also built on Pokemon FireRed 1.0 (USA) and is distributed as a BPS patch. It requires a clean, unheadered ROM file.",
  },
  {
    question: "What is the base ROM for Pokemon Gaia?",
    answer:
      "Pokemon Gaia is built on Pokemon FireRed, and community documentation consistently points to version 1.0 rather than 1.1 for reliable patching.",
  },
  {
    question: "Are FireRed and Emerald patches interchangeable?",
    answer:
      "No. A patch built for FireRed will not work on an Emerald ROM, and vice versa — the two games have different internal structures. Mixing them up is one of the most common patching mistakes.",
  },
  {
    question: "Can I patch Pokemon ROM hacks on Android?",
    answer:
      "Many players use apps like UniPatcher for IPS/UPS/BPS patches on Android. This site's ROM patcher also runs in mobile browsers, since patching happens locally without installing extra software.",
  },
  {
    question: "What does checksum mismatch mean?",
    answer:
      "Formats like UPS and BPS store a checksum of the exact base ROM they expect. If your ROM doesn't match — wrong region, revision, or a modified file — the patcher reports a checksum mismatch instead of applying a potentially broken patch.",
  },
  {
    question: "Which patch format do Pokemon ROM hacks use?",
    answer:
      "It varies by hack: IPS and UPS are common for older GBA and GBC hacks, BPS has become popular for modern GBA hacks, and NDS hacks (Platinum, HeartGold, SoulSilver, Black/White) almost always use xdelta. When in doubt, check the hack's official patch notes.",
  },
  {
    question: "Will this work for Gen 3–5 ROM hacks?",
    answer:
      "Yes. The patcher supports IPS, UPS, BPS, and xdelta patches, covering GBA and GBC-era hacks (Gen 2–3) as well as NDS hacks (Gen 4–5).",
  },
];

const patchingMistakes = [
  {
    problem: "Using the wrong base ROM",
    solution: "Different regions and revisions (1.0 vs 1.1) have different internal data — a mismatched base ROM is the #1 cause of failed patches.",
    icon: <IconDatabase />,
  },
  {
    problem: "Using a modified ROM instead of a clean base",
    solution: "Cheats, prior patches, or randomizers change the ROM's data, so patches built for a clean base ROM will usually fail or corrupt the file.",
    icon: <IconAlertTriangle />,
  },
  {
    problem: "Mixing FireRed and Emerald hacks",
    solution: "A patch built for FireRed cannot be applied to Emerald (or vice versa) — always match the patch to its intended base game.",
    icon: <IconLayers />,
  },
  {
    problem: "Using the wrong patch format",
    solution: "IPS, UPS, BPS, and xdelta are not interchangeable. Applying the wrong patcher to a file usually produces an error instead of a working ROM.",
    icon: <IconFileQuestion />,
  },
  {
    problem: "Opening the patched file in the wrong emulator",
    solution: "GBA hacks need a GBA-compatible emulator, NDS hacks need an NDS-compatible one — mismatched emulators commonly show as a white or black screen.",
    icon: <IconMonitorX />,
  },
];

export default function PokemonRomPatcherPage() {
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Patch a Pokemon ROM Hack",
    description:
      "Steps to correctly patch a Pokemon ROM hack using the right base ROM and patch format.",
    step: [
      {
        "@type": "HowToStep",
        name: "Find the hack name",
        text: "Look up the Pokemon ROM hack you want to play in the base ROM reference table.",
      },
      {
        "@type": "HowToStep",
        name: "Check the required base game",
        text: "Confirm which original Pokemon game (FireRed, Emerald, Crystal, Platinum, etc.) the hack is built on.",
      },
      {
        "@type": "HowToStep",
        name: "Confirm the patch format",
        text: "Check whether the hack uses IPS, UPS, BPS, or xdelta, since each format needs a matching patcher.",
      },
      {
        "@type": "HowToStep",
        name: "Use the ROM patcher tool",
        text: "Select your clean base ROM and the patch file in the ROM patcher tool.",
      },
      {
        "@type": "HowToStep",
        name: "Check troubleshooting if patching fails",
        text: "If the patch fails or the game doesn't load, check common fixes for checksum mismatches and wrong base ROM errors.",
      },
    ],
  };

  return (
    <div className="container-page flex flex-col gap-10 py-10 sm:py-14">
      <JsonLd data={howToJsonLd} />
      <Breadcrumbs items={[{ href: "/pokemon-rom-patcher", label: "Pokemon ROM Patcher" }]} />

      <div className="relative">
        <BackgroundGlow />
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Pokemon ROM Patcher</h1>
          <p className="max-w-2xl text-muted sm:text-lg">
            Apply Pokemon ROM hack patches directly in your browser. Nothing is uploaded — your base
            ROM and patch file stay on your device.
          </p>
        </div>

        <div id="pokemon-rom-tool" className="mt-8 flex flex-col gap-6 scroll-mt-24">
          <RomPatcherTool />
          <PrivacyNote />
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <SectionHeading
          icon={<IconLayers />}
          title="Top 50 Pokemon ROM Hacks and Required Base ROMs"
          accent="purple"
        />
        <p className="max-w-3xl text-muted">
          Most Pokemon ROM hacks are distributed as a patch, not a full game — you apply that patch
          to your own copy of the original Pokemon base ROM it was built on. Using the wrong base
          ROM is the most common reason a Pokemon ROM hack patch fails, showing up as a checksum
          mismatch, a rejected patch, a white screen, or random crashes in-game. The pokemon base
          rom reference below covers the required base game, platform, and common patch format for
          50 popular Pokemon ROM hacks, including{" "}
          <a href="#base-rom-table" className="text-accent-blue hover:underline">
            Radical Red, Unbound, and Emerald Rogue
          </a>
          .
        </p>

        <div className="rounded-xl border border-accent-blue/30 bg-accent-blue/5 px-4 py-3 text-sm text-muted">
          <span className="font-medium text-foreground">Tip:</span> Always check the official patch
          notes for the exact base version. Some hacks need FireRed 1.0, Emerald 1.0, Crystal, or
          Platinum specifically — a different revision of the same game can still cause a checksum
          mismatch.
        </div>

        <div id="base-rom-table">
          <PokemonHackBaseRomTable />
        </div>

        <p className="text-sm text-muted">
          Once you&apos;ve confirmed the right base game and format, head back up to the{" "}
          <a href="#pokemon-rom-tool" className="text-accent-blue hover:underline">
            Pokemon ROM patcher
          </a>{" "}
          above, or use the{" "}
          <Link href="/" className="text-accent-blue hover:underline">
            general ROM patcher tool
          </Link>{" "}
          on the homepage. For format details, see{" "}
          <Link href="/patch-formats" className="text-accent-blue hover:underline">
            Patch Formats Explained
          </Link>
          , and for a full walkthrough, see{" "}
          <Link href="/how-to-patch-pokemon-rom-hacks" className="text-accent-blue hover:underline">
            How to Patch Pokemon ROM Hacks
          </Link>
          .
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconInfo />} title="How to Use This Pokemon ROM Hack Table" accent="blue" />
        <ol className="grid list-none gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            "Find the hack name in the search box or table.",
            "Check the required base game for that hack.",
            "Confirm the common patch format (IPS, UPS, BPS, or xdelta).",
            "Use the ROM patcher tool with your base ROM and patch file.",
            "If patching fails, check the troubleshooting guide.",
          ].map((step, index) => (
            <li key={step} className="card flex flex-col gap-2 rounded-xl p-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-accent-green to-accent-blue text-xs font-bold text-background">
                {index + 1}
              </span>
              <p className="text-sm text-muted">{step}</p>
            </li>
          ))}
        </ol>
        <div>
          <ButtonLink href="/troubleshooting" variant="outline" className="w-fit">
            Open Troubleshooting Guide
            <IconArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconAlertTriangle />} title="Common Pokemon Patching Mistakes" accent="amber" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {patchingMistakes.map((mistake) => (
            <TroubleshootingCard
              key={mistake.problem}
              problem={mistake.problem}
              solution={mistake.solution}
              icon={mistake.icon}
              href="/troubleshooting"
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconGamepad />} title="Patching Pokemon ROM Hacks" accent="purple" />
        <div className="rounded-xl border-l-4 border-purple-500/40 bg-card/40 p-5">
          <p className="max-w-3xl text-muted">
            Pokemon ROM hacks range from small difficulty tweaks to entirely new regions and
            stories. Because hack creators can&rsquo;t legally distribute the full modified game,
            they distribute a patch file — usually in IPS, UPS, or BPS format — that you apply to
            your own legally-dumped copy of the original game using a{" "}
            <Link href="/" className="text-accent-blue hover:underline">
              Pokemon ROM patcher
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconInfo />} title="Tips for Pokemon ROM Hacks" accent="blue" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            "Always check the required base ROM region and revision before patching.",
            "Keep an unpatched backup of your original ROM.",
            "Some hacks require a “clean” (unheadered) ROM — check the hack’s notes.",
            "BPS patches include a checksum, so a mismatched base ROM will be rejected automatically.",
          ].map((tip) => (
            <div key={tip} className="card rounded-xl p-4 text-sm text-muted">
              {tip}
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconInfo />} title="Related Guides" accent="blue" />
        <RelatedGuides
          items={[
            {
              href: "/how-to-patch-pokemon-rom-hacks",
              title: "How to Patch Pokemon ROM Hacks",
              description: "A step-by-step guide for Pokemon ROM hack patching.",
            },
            {
              href: "/patch-formats",
              title: "Patch Formats Explained",
              description: "IPS vs UPS vs BPS vs xdelta — which one do you need?",
            },
            {
              href: "/troubleshooting",
              title: "Troubleshooting",
              description: "Fix common ROM patching errors and mismatches.",
            },
            {
              href: "/gba-rom-patcher",
              title: "GBA ROM Patcher",
              description: "Most Pokemon ROM hacks run on Game Boy Advance — patch details here.",
            },
          ]}
        />
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconInfo />} title="FAQ" accent="blue" />
        <FaqAccordion items={faqItems} />
      </section>

      <div className="card flex flex-col items-center gap-3 rounded-2xl p-6 text-center">
        <p className="text-sm text-muted">
          Ready to patch your Pokemon ROM hack? {siteConfig.name} processes everything locally in
          your browser — nothing is uploaded.
        </p>
        <ButtonLink href="/" variant="primary" className="w-fit">
          Open the ROM Patcher Tool
          <IconArrowRight className="h-4 w-4" />
        </ButtonLink>
      </div>
    </div>
  );
}
