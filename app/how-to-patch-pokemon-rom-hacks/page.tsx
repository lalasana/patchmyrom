import type { Metadata } from "next";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import RelatedGuides from "@/components/ui/RelatedGuides";
import JsonLd from "@/components/seo/JsonLd";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "How to Patch Pokemon ROM Hacks — Step-by-Step Guide",
  description:
    "A step-by-step guide to patching Pokemon ROM hacks safely and correctly, entirely in your browser.",
  path: "/how-to-patch-pokemon-rom-hacks",
});

const steps = [
  {
    title: "Get your original ROM",
    body: "Start with a legally-dumped backup of the base game the hack is built on. PatchMyROM does not provide ROM files.",
  },
  {
    title: "Download the patch file",
    body: "Download the hack's patch file (usually .ips, .ups, or .bps) from the hack creator's official page.",
  },
  {
    title: "Check the required base ROM",
    body: "Read the hack's documentation for the required region and revision (e.g. Fire Red 1.0 USA). Using the wrong base ROM is the most common cause of patching failures.",
  },
  {
    title: "Select both files in the patcher",
    body: "Choose your original ROM and the patch file. Everything happens locally in your browser — no files are uploaded.",
  },
  {
    title: "Apply the patch and download",
    body: "Once applied, download your patched ROM and load it in your emulator of choice.",
  },
];

export default function HowToPatchPage() {
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Patch Pokemon ROM Hacks",
    description:
      "A step-by-step guide to patching Pokemon ROM hacks safely and correctly, entirely in your browser.",
    step: steps.map((step) => ({
      "@type": "HowToStep",
      name: step.title,
      text: step.body,
    })),
  };

  return (
    <div className="container-page flex flex-col gap-10 py-10 sm:py-14">
      <JsonLd data={howToJsonLd} />
      <Breadcrumbs
        items={[{ href: "/how-to-patch-pokemon-rom-hacks", label: "How to Patch Pokemon ROM Hacks" }]}
      />

      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
          How to Patch Pokemon ROM Hacks
        </h1>
        <p className="max-w-2xl text-muted sm:text-lg">
          A straightforward, step-by-step guide to safely patching Pokemon ROM hacks.
        </p>
      </div>

      <ol className="flex flex-col gap-4">
        {steps.map((step, index) => (
          <li key={step.title} className="card flex gap-4 px-5 py-5">
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-gradient-to-br from-accent-green to-accent-blue text-xs font-bold text-background">
              {index + 1}
            </span>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{step.title}</h2>
              <p className="mt-1 text-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold text-foreground">Related Guides</h2>
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
              description: "Format tips and notes specific to Pokemon ROM hacks.",
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
          ]}
        />
      </section>
    </div>
  );
}
