import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/ui/PageHero";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import CardArt from "@/components/ui/CardArt";
import FaqAccordion from "@/components/ui/FaqAccordion";
import PrivacyNote from "@/components/ui/PrivacyNote";
import RelatedGuides from "@/components/ui/RelatedGuides";
import SectionHeading from "@/components/ui/SectionHeading";
import { TrustBadge } from "@/components/ui/TrustBadge";
import JsonLd from "@/components/seo/JsonLd";
import PatchCompatibilityTool from "@/components/tools/PatchCompatibilityTool";
import { IconAlertTriangle, IconCloudOff, IconDatabase, IconInfo, IconLayers, IconShieldCheck } from "@/components/ui/icons";
import { siteConfig } from "@/lib/site";
import { buildPageMetadata } from "@/lib/seo";

const PATH = "/patch-compatibility-checker";

export const metadata: Metadata = buildPageMetadata({
  title: "ROM & Patch Compatibility Checker — Will This Patch Work?",
  description:
    "Check whether a ROM matches an IPS, UPS, BPS or xdelta patch before patching. Verifies stored checksums and says plainly when a format can't be checked.",
  path: PATH,
});

const outcomes = [
  {
    label: "Compatible",
    art: "shield" as const,
    accent: "green" as const,
    title: "A stored checksum matched",
    body: "The patch carries data about the ROM it was made for (a CRC32, an MD5 or a cartridge ID) and your ROM matches it. You can patch with confidence. The checker names exactly what was compared, because for a few formats that is only part of the file.",
  },
  {
    label: "Mismatch",
    art: "wrongrom" as const,
    accent: "amber" as const,
    title: "The patch's own data says no",
    body: "Your ROM is not the one the patch needs: a different region or revision, an already modified ROM, or a file with a different header. If your ROM is already the finished result of the patch, the checker tells you that instead.",
  },
  {
    label: "Cannot verify",
    art: "unsupported" as const,
    accent: "purple" as const,
    title: "There is nothing to compare",
    body: "IPS, xdelta, PPF and BDF patches do not record which ROM they were made for. Nobody can prove a match in advance, so the checker never says “compatible” for them. It gives you facts and the steps that do help.",
  },
];

const formats = [
  { name: "UPS", stores: "CRC32 and size of the original and the result", result: "Compatible or Mismatch" },
  { name: "BPS", stores: "CRC32 and size of the original and the result", result: "Compatible or Mismatch" },
  { name: "RUP", stores: "MD5 of the original and the result", result: "Compatible or Mismatch (the patching library's own check)" },
  { name: "APS (N64)", stores: "The cartridge ID and CRC from the header only", result: "Compatible or Mismatch, stated as a header-only check" },
  { name: "APS (GBA)", stores: "File size and a CRC16 of every changed block", result: "Compatible or Mismatch" },
  { name: "PMSR", stores: "Made for exactly one known ROM", result: "Compatible or Mismatch" },
  { name: "IPS", stores: "Nothing about the ROM", result: "Cannot verify" },
  { name: "xdelta", stores: "Nothing about the ROM", result: "Cannot verify" },
  { name: "PPF, BDF, APS (plain)", stores: "Nothing PatchMyROM relies on", result: "Cannot verify" },
];

const faqItems = [
  {
    question: "Can this tell me whether an IPS patch will work on my ROM?",
    answer:
      "No, and no honest tool can. An IPS patch is a list of “write these bytes at this position” instructions with no checksum or size of the ROM it was made for. The checker reports what it can see (how many records the patch has and how far into the ROM it writes) and tells you to compare your ROM with the one the patch's author names. It will never label an IPS patch Compatible.",
  },
  {
    question: "Does “Cannot verify” mean the patch is broken?",
    answer:
      "No. It means the format has nothing to check against. The patch may be perfectly fine. A damaged or unreadable patch is reported separately, with its own explanation.",
  },
  {
    question: "My ROM looks right but it says Mismatch. Why?",
    answer:
      "Checksum formats compare every byte. A different dump of the same game, another region or revision, a trimmed or padded file, a ROM that was already patched or edited, or a SNES copier header that the patch does not expect will all fail the comparison. The results page shows the checksum and size the patch needs next to yours.",
  },
  {
    question: "What is a SNES copier header?",
    answer:
      "Some older SNES dumps start with 512 extra bytes written by a backup device. Patches are made either for the ROM with that header or without it. The checker recognises the header from the file size and from where the ROM's internal header sits, sets it aside the way the patcher does, and tells you when the patch expects the other version. It never strips bytes it cannot positively identify.",
  },
  {
    question: "Why can't some very large ROMs be checked against RUP, APS or PMSR patches?",
    answer:
      "Those three formats are validated by the patching library, which needs the whole ROM in memory at once. To keep your browser from running out of memory, the checker does that only for ROMs up to 256 MB and otherwise says Cannot Verify and explains why. UPS, BPS, IPS and xdelta checks read the ROM in small pieces and have no such limit.",
  },
  {
    question: "Does the checker change or upload my files?",
    answer:
      "No. Both files are only read, inside your browser, and nothing is sent anywhere. No patched file is produced; use the ROM patcher for that.",
  },
  {
    question: "How is this different from the patcher's own check?",
    answer:
      "It is the same engine and the same rules. The patcher runs the check just before patching and blocks a wrong ROM. This page lets you diagnose a ROM and patch without creating any output, and gives you a full explanation and next steps you can copy into a bug report or a forum post.",
  },
];

export default function PatchCompatibilityCheckerPage() {
  const appJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "PatchMyROM ROM & Patch Compatibility Checker",
    url: `${siteConfig.url}${PATH}`,
    description:
      "Checks in the browser whether a ROM matches an IPS, UPS, BPS, xdelta or other patch. Verifies the checksums a patch format stores and reports Compatible, Mismatch or Cannot Verify.",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any (runs in a web browser)",
    browserRequirements: "Requires JavaScript and Web Workers",
    isAccessibleForFree: true,
    inLanguage: "en",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: [
      "Compatible, Mismatch and Cannot Verify results with the reason for each",
      "Verifies UPS, BPS, RUP, APS and PMSR patches against the data they store",
      "Never claims compatibility for formats without checksums, such as IPS and xdelta",
      "Detects SNES copier headers and explains header-related mismatches",
      "Troubleshooting steps and a copyable report",
      "No upload: files are processed locally in the browser",
    ],
    isPartOf: { "@type": "WebSite", name: siteConfig.name, url: siteConfig.url },
  };

  return (
    <div className="container-page flex flex-col gap-12 py-10 sm:py-14">
      <JsonLd data={appJsonLd} />
      <Breadcrumbs items={[{ href: PATH, label: "Patch Compatibility Checker" }]} />

      <PageHero art="patch" accent="green">
        <h1>ROM &amp; Patch Compatibility Checker</h1>
        <p className="max-w-2xl text-muted sm:text-lg">
          Find out whether your ROM is the one a patch was made for before you patch it. You get a clear result, the evidence behind it and what to do next.
        </p>
        <div className="flex flex-wrap gap-2">
          <TrustBadge icon={<IconCloudOff />} label="No upload" />
          <TrustBadge icon={<IconShieldCheck />} label="Honest results" />
          <TrustBadge icon={<IconAlertTriangle />} label="SNES header aware" />
        </div>
      </PageHero>

      <section className="flex flex-col gap-4">
        <PatchCompatibilityTool />
        <PrivacyNote />
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconInfo />} title="What the Three Results Mean" accent="green" />
        <div className="grid gap-5 lg:grid-cols-3">
          {outcomes.map((item) => (
            <article key={item.label} className="pixel-card flex flex-col overflow-hidden">
              <CardArt name={item.art} accent={item.accent} className="h-28" />
              <div className="flex flex-col gap-1.5 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">{item.label}</p>
                <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{item.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconDatabase />} title="What Each Patch Format Can Prove" subtitle="The result depends on what the patch file itself records." accent="blue" />
        <div className="pixel-card overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <caption className="sr-only">Patch formats, what each one stores about the original ROM, and the result the checker can give</caption>
            <thead>
              <tr className="border-b-2 border-border bg-card/80 text-accent-green">
                <th scope="col" className="px-4 py-3 font-semibold">Format</th>
                <th scope="col" className="px-4 py-3 font-semibold">What it stores about the ROM</th>
                <th scope="col" className="px-4 py-3 font-semibold">Result you can get</th>
              </tr>
            </thead>
            <tbody>
              {formats.map((row) => (
                <tr key={row.name} className="border-b border-border/60 last:border-0">
                  <th scope="row" className="px-4 py-3 font-semibold text-foreground">{row.name}</th>
                  <td className="px-4 py-3 text-muted">{row.stores}</td>
                  <td className="px-4 py-3 text-muted">{row.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted">
          Memory note: RUP, APS and PMSR checks load the whole ROM into memory, so they are limited to ROMs of up to 256 MB; larger files are reported as Cannot Verify with an explanation. UPS, BPS, IPS and xdelta checks read the ROM in small pieces and are not limited.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconAlertTriangle />} title="SNES Copier Headers" accent="amber" />
        <div className="pixel-card flex flex-col gap-3 border-l-4 border-l-amber-400 p-6 text-muted">
          <p>
            A SNES ROM dumped by an old backup unit may begin with 512 bytes that are not part of the game. A ROM with one is 512 bytes larger than the same ROM without, which changes its checksum even though the game is identical. A patch is made for one version or the other, and applying it to the wrong one fails or, for IPS, silently corrupts the game.
          </p>
          <p>
            The checker looks at the file size and at where the ROM&apos;s internal header sits. If the ROM has a header the patcher can identify, the check is done on the ROM without it, exactly as the patcher does, and you are told. If the patch expects a header your ROM does not have, or your ROM has one the patcher will not remove, the result explains the 512-byte difference and what to do. It does not add or remove bytes for you without a positive identification.
          </p>
          <p>
            More on patching SNES games, including header handling, is in the{" "}
            <Link href="/snes-rom-patcher" className="text-accent-blue hover:underline">
              SNES ROM patcher guide
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconInfo />} title="FAQ" accent="blue" />
        <FaqAccordion items={faqItems} />
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconLayers />} title="Related Tools and Guides" accent="blue" />
        <RelatedGuides
          items={[
            {
              href: "/rom-checksum-checker",
              title: "ROM Checksum Checker",
              description: "Get a ROM's CRC32, MD5, SHA-1 and SHA-256 and compare them with a published value.",
            },
            {
              href: "/",
              title: "ROM Patcher",
              description: "Apply the patch once the ROM checks out.",
            },
            {
              href: "/troubleshooting",
              title: "Troubleshooting",
              description: "Fix common ROM patching errors and mismatches.",
            },
            {
              href: "/patch-formats",
              title: "Patch Formats Explained",
              description: "IPS vs UPS vs BPS vs xdelta — what each one stores and when to use it.",
            },
          ]}
        />
      </section>
    </div>
  );
}
