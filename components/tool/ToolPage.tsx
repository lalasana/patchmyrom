import type { ReactNode } from "react";
import PageHero from "@/components/ui/PageHero";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import RelatedGuides, { type RelatedGuide } from "@/components/ui/RelatedGuides";
import TroubleshootingCard, { type TroubleshootingItem } from "@/components/ui/TroubleshootingCard";
import FaqAccordion, { type FaqItem } from "@/components/ui/FaqAccordion";
import SectionHeading, { type SectionAccent } from "@/components/ui/SectionHeading";
import PrivacyNote from "@/components/ui/PrivacyNote";
import GbaEmulatorCta from "@/components/ui/GbaEmulatorCta";
import JsonLd from "@/components/seo/JsonLd";
import RomPatcherTool from "@/components/tool/RomPatcherTool";
import type { PatchFormat } from "@/components/tool/FormatSelector";
import type { CardArtAccent, CardArtName } from "@/components/ui/CardArt";
import { FormatChip, type FormatKey } from "@/components/ui/FormatBadge";
import { IconAlertTriangle, IconInfo, IconLayers, IconMonitorX, IconShieldCheck } from "@/components/ui/icons";
import type { GbaEmulatorPlacement } from "@/lib/gba-emulator";

export type ToolPageProps = {
  /** Route, e.g. "/gba-rom-patcher". Only used for the breadcrumb. */
  path: string;
  breadcrumbLabel: string;
  art: CardArtName;
  accent: CardArtAccent;
  /** The page's <h1>. */
  title: string;
  intro: ReactNode;
  chips: FormatKey[];
  /** The shared patcher, configured for this page. */
  patcher: {
    heading: string;
    defaultFormat?: PatchFormat;
    romLabel?: string;
    romHint?: string;
    patchHint?: string;
  };
  /** "Before you patch" copy with descriptive links to the checkers. */
  verify: ReactNode;
  /** The one platform/format-specific insight that makes this page worth having. */
  feature: { icon: ReactNode; title: string; accent: SectionAccent; body: ReactNode };
  /** Optional extra section after the feature (a table, a size chart...). */
  extra?: ReactNode;
  howTo: { name: string; description: string; heading?: string; steps: { title: string; body: string }[] };
  mistakesTitle: string;
  mistakes: TroubleshootingItem[];
  troubleshooting: TroubleshootingItem[];
  faq: FaqItem[];
  related: RelatedGuide[];
  emulatorCta?: { placement: GbaEmulatorPlacement; note?: string };
  footer?: ReactNode;
};

/**
 * Layout shared by the nine console / patch-format pages: hero, the real patcher right below it,
 * then the guidance that is specific to the page. Content stays in each page file.
 */
export default function ToolPage(props: ToolPageProps) {
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: props.howTo.name,
    description: props.howTo.description,
    step: props.howTo.steps.map((step) => ({ "@type": "HowToStep", name: step.title, text: step.body })),
  };

  return (
    <div className="container-page flex flex-col gap-10 py-10 sm:py-14">
      <JsonLd data={howToJsonLd} />
      <Breadcrumbs items={[{ href: props.path, label: props.breadcrumbLabel }]} />

      <PageHero art={props.art} accent={props.accent}>
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{props.title}</h1>
        <div className="max-w-2xl text-muted sm:text-lg">{props.intro}</div>
        <div className="flex flex-wrap gap-2">
          {props.chips.map((chip) => (
            <FormatChip key={chip} format={chip} />
          ))}
        </div>
      </PageHero>

      <section id="patcher" aria-label={props.patcher.heading} className="flex scroll-mt-24 flex-col gap-4">
        <RomPatcherTool {...props.patcher} />
        <PrivacyNote />
      </section>

      <section className="pixel-card flex flex-col gap-3 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-accent-blue/15 text-accent-blue">
            <IconShieldCheck className="h-5 w-5" />
          </span>
          <h2 className="text-xl font-bold text-foreground">Before you patch</h2>
        </div>
        <div className="max-w-3xl space-y-2 text-muted">{props.verify}</div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={props.feature.icon} title={props.feature.title} accent={props.feature.accent} />
        <div className="card border-l-4 border-l-accent-green p-5">
          <div className="max-w-3xl space-y-3 text-muted">{props.feature.body}</div>
        </div>
      </section>

      {props.extra}

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconLayers />} title={props.howTo.heading ?? "Step-by-Step"} accent="blue" />
        <div className="grid gap-4 sm:grid-cols-2">
          {props.howTo.steps.map((step, index) => (
            <div key={step.title} className="card flex gap-4 p-5">
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-accent-green to-accent-blue text-base font-extrabold text-background shadow-[0_6px_16px_-4px_rgba(57,224,127,0.6)]">
                {index + 1}
              </span>
              <div>
                <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                <p className="mt-1 text-sm text-muted">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
        {props.emulatorCta && <GbaEmulatorCta placement={props.emulatorCta.placement} note={props.emulatorCta.note} />}
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconAlertTriangle />} title={props.mistakesTitle} accent="amber" />
        <div className="grid gap-4 sm:grid-cols-3">
          {props.mistakes.map((item) => (
            <TroubleshootingCard key={item.problem} problem={item.problem} solution={item.solution} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconMonitorX />} title="Troubleshooting" accent="amber" />
        <div className="grid gap-4 sm:grid-cols-3">
          {props.troubleshooting.map((item) => (
            <TroubleshootingCard
              key={item.problem}
              problem={item.problem}
              solution={item.solution}
              href="/troubleshooting"
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconInfo />} title="FAQ" accent="blue" />
        <FaqAccordion items={props.faq} />
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconLayers />} title="Related Guides" accent="blue" />
        <RelatedGuides items={props.related} />
      </section>

      {props.footer && <p className="text-xs text-muted">{props.footer}</p>}
    </div>
  );
}
