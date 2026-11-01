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
import RomChecksumTool from "@/components/tools/RomChecksumTool";
import { IconBolt, IconCloudOff, IconDatabase, IconInfo, IconLayers, IconShieldCheck } from "@/components/ui/icons";
import { siteConfig } from "@/lib/site";
import { buildPageMetadata } from "@/lib/seo";

const PATH = "/rom-checksum-checker";

export const metadata: Metadata = buildPageMetadata({
  title: "ROM Checksum Checker — CRC32, MD5, SHA-1 & SHA-256 Online",
  description:
    "Calculate a ROM's CRC32, MD5, SHA-1 and SHA-256 in your browser, compare it with a published checksum and identify the console. Nothing is uploaded.",
  path: PATH,
});

const algorithms = [
  {
    name: "CRC32",
    length: "8 hex digits",
    art: "checksum" as const,
    body: "A short, fast checksum that is very good at catching accidental damage. UPS and BPS patches store the CRC32 of the ROM they were made for, and ROM databases list it, so it is the one you will see most often. Because it is short, two different files can share a CRC32 by chance; use it together with a longer one when you can.",
  },
  {
    name: "MD5",
    length: "32 hex digits",
    art: "shield" as const,
    body: "A 128-bit fingerprint. It is no longer safe against someone deliberately crafting a colliding file, but for the question people actually ask — is my copy identical to that one? — it is reliable. RUP patches and many ROM lists use MD5.",
  },
  {
    name: "SHA-1",
    length: "40 hex digits",
    art: "wrongrom" as const,
    body: "A 160-bit fingerprint that preservation projects such as No-Intro and Redump publish next to each dump. Like MD5 it is outdated for security, and still the usual way to identify a specific ROM revision.",
  },
  {
    name: "SHA-256",
    length: "64 hex digits",
    art: "guide" as const,
    body: "The strongest of the four and the one to prefer when a source offers it. Fewer ROM databases list it, but a match on SHA-256 is as close to proof of an identical file as a checksum gets.",
  },
];

const steps = [
  { title: "Select your ROM", description: "Drop the file onto the checker or click to browse. It is read on your device, a few megabytes at a time.", art: "cartridge" as const },
  { title: "Read the results", description: "You get the file size, the platform (and how sure the tool is), and all four checksums, each with a copy button.", art: "checksum" as const },
  { title: "Compare", description: "Paste the checksum from a ROM database or the patch's readme. A match, or a clear explanation of why not, appears at once.", art: "shield" as const },
];

const faqItems = [
  {
    question: "Is my ROM uploaded anywhere?",
    answer:
      "No. The file is read inside your browser by a background worker, and the checksums are calculated there. Nothing is sent to PatchMyROM or any other server, and files of any size are read in small pieces. The page and its worker script are downloaded from PatchMyROM like any website, so this is not an offline tool; only your file stays on your device.",
  },
  {
    question: "Which checksum should I compare?",
    answer:
      "Use the one your source lists. If it lists several, compare the longest: SHA-256 or SHA-1 is far less likely to match by accident than CRC32. You can paste more than one value at a time, one per line, and every one of them is checked.",
  },
  {
    question: "Why doesn't my ROM's checksum match the one in the database or readme?",
    answer:
      "The usual reasons are a different region or revision of the game, a ROM that was already patched, trimmed or translated, an extra copier header (SNES dumps often carry 512 bytes at the start that the reference checksum leaves out), or an incomplete download. Check the exact version the checksum was taken from.",
  },
  {
    question: "Can it tell me the game's title or region?",
    answer:
      "No. It recognises the console from the file's own header (and says so), but it does not contain a game database, so it cannot name the game. Compare the checksum with a database such as No-Intro to identify the exact release.",
  },
  {
    question: "How reliable is the platform detection?",
    answer:
      "It reports how it knows. “Confirmed from header” means a platform-specific header check passed (for example the GBA header complement, the Nintendo DS header CRC or the SNES checksum pair). “From file extension only” means no header check could confirm it, which is common for hacked or trimmed ROMs. “Not recognised” means neither a header nor the extension matched.",
  },
  {
    question: "Does a matching checksum mean the ROM is legal to use?",
    answer:
      "No. A checksum only shows that two files are identical. You are responsible for the ROMs you use; PatchMyROM does not provide or host ROM files.",
  },
];

export default function RomChecksumCheckerPage() {
  const appJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "PatchMyROM ROM Checksum Checker",
    url: `${siteConfig.url}${PATH}`,
    description: "Calculates CRC32, MD5, SHA-1 and SHA-256 for a ROM file in the browser, compares them with a pasted checksum and identifies the console from the file header.",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any (runs in a web browser)",
    browserRequirements: "Requires JavaScript and Web Workers",
    isAccessibleForFree: true,
    inLanguage: "en",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: [
      "CRC32, MD5, SHA-1 and SHA-256 in a single pass",
      "Compare against a pasted checksum, with the algorithm detected automatically",
      "Platform detection from file headers, with a confidence level",
      "Constant-memory processing of large files",
      "No upload: files are processed locally in the browser",
    ],
    isPartOf: { "@type": "WebSite", name: siteConfig.name, url: siteConfig.url },
  };

  return (
    <div className="container-page flex flex-col gap-12 py-10 sm:py-14">
      <JsonLd data={appJsonLd} />
      <Breadcrumbs items={[{ href: PATH, label: "ROM Checksum Checker" }]} />

      <PageHero art="checksum" accent="blue">
        <h1>ROM Checksum Checker</h1>
        <p className="max-w-2xl text-muted sm:text-lg">
          Get the CRC32, MD5, SHA-1 and SHA-256 of any ROM, see which console it is from, and check it against the checksum a patch or ROM database tells you to expect.
        </p>
        <div className="flex flex-wrap gap-2">
          <TrustBadge icon={<IconCloudOff />} label="No upload" />
          <TrustBadge icon={<IconBolt />} label="Large files supported" />
          <TrustBadge icon={<IconShieldCheck />} label="4 checksums at once" />
        </div>
      </PageHero>

      <section className="flex flex-col gap-4">
        <RomChecksumTool />
        <PrivacyNote />
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconDatabase />} title="What Each Checksum Tells You" subtitle="All four are computed together, in one pass over the file." accent="blue" />
        <div className="grid gap-5 sm:grid-cols-2">
          {algorithms.map((item) => (
            <article key={item.name} className="pixel-card flex flex-col overflow-hidden">
              <CardArt name={item.art} accent="blue" className="h-24" />
              <div className="flex flex-col gap-1.5 p-5">
                <h3 className="flex items-baseline gap-2 text-xl font-bold text-foreground">
                  {item.name}
                  <span className="text-xs font-medium text-muted">{item.length}</span>
                </h3>
                <p className="text-sm leading-relaxed text-muted">{item.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconLayers />} title="How It Works" accent="green" />
        <div className="grid gap-5 sm:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="pixel-card flex flex-col overflow-hidden">
              <div className="relative">
                <CardArt name={step.art} accent="green" className="h-32" />
                <span className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-green to-accent-blue text-base font-extrabold text-background">{index + 1}</span>
              </div>
              <div className="flex flex-col gap-1.5 p-5">
                <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconInfo />} title="How the Platform Is Detected" accent="purple" />
        <div className="pixel-card flex flex-col gap-3 border-l-4 border-l-accent-purple p-6 text-muted">
          <p>
            A file extension is only a name, so the checker looks inside the file as well. It tests for the header each console format defines: the iNES signature on NES, the internal checksum pair on SNES (found with or without a 512-byte copier header), the header checksum on Game Boy, Game Boy Advance and Nintendo DS, the byte-order signature on Nintendo 64, and the system signature on Sega Genesis, Master System and Game Gear.
          </p>
          <p>
            When a header check passes, the platform is shown as <strong className="text-foreground">confirmed</strong>. If the extension and the header disagree, the header wins and the page says so. Hacked, translated and trimmed ROMs sometimes fail a header check even though they are fine, so the result then falls back to <strong className="text-foreground">file extension only</strong>, labelled as such. Other consoles are identified by extension only.
          </p>
          <p>
            Large files are read in 4 MB pieces and fed straight into the four checksum calculations, so memory use stays flat whatever the file size; a bigger file only takes longer.
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
              href: "/patch-compatibility-checker",
              title: "ROM & Patch Compatibility Checker",
              description: "Find out whether a ROM matches a patch before you patch it.",
            },
            {
              href: "/",
              title: "ROM Patcher",
              description: "Apply an IPS, UPS, BPS or xdelta patch in your browser.",
            },
            {
              href: "/troubleshooting",
              title: "Troubleshooting",
              description: "Fix checksum mismatches and other common patching errors.",
            },
            {
              href: "/snes-rom-patcher",
              title: "SNES ROM Patcher",
              description: "Why a SNES ROM can have a 512-byte copier header, and what it does to checksums.",
            },
          ]}
        />
        <p className="text-xs text-muted">
          Not sure which format a patch uses? See{" "}
          <Link href="/patch-formats" className="text-accent-blue hover:underline">
            how IPS, UPS, BPS and xdelta differ
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
