import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import FaqAccordion from "@/components/ui/FaqAccordion";
import RelatedGuides from "@/components/ui/RelatedGuides";
import JsonLd from "@/components/seo/JsonLd";
import GbaEmulatorIcon from "@/components/ui/GbaEmulatorIcon";
import { GooglePlayButton, SystemChips } from "@/components/ui/GbaEmulatorCta";
import { ButtonLink } from "@/components/ui/Button";
import {
  IconArrowRight,
  IconBolt,
  IconCartridge,
  IconCloudOff,
  IconDatabase,
  IconDownloadTray,
  IconGamepad,
  IconLayers,
  IconPatchFile,
  IconShieldCheck,
  IconSmartphone,
} from "@/components/ui/icons";
import {
  GBA_EMULATOR_DEVELOPER,
  GBA_EMULATOR_NAME,
  GBA_EMULATOR_PAGE,
  GBA_EMULATOR_TITLE,
  GBA_EMULATOR_URL,
} from "@/lib/gba-emulator";
import { buildPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

const DESCRIPTION =
  "GBA Emulator: Play Retro Games by Gamesira — a free Android emulator for your own GBA, GBC & GB games, with saves, cheats and custom controls. Get it on Google Play.";

export const metadata: Metadata = buildPageMetadata({
  title: "GBA Emulator: Play Retro Games — GBA, GBC & GB for Android",
  description: DESCRIPTION,
  path: GBA_EMULATOR_PAGE,
  image: "/gba-emulator/og-gba-emulator.png",
});

// Screenshots are the app's own Google Play listing images (replace files, keep names).
// The app icon is icon-{48,64,96,128,160,192,320,512}.webp.
const shot = (n: number, slug: string, alt: string, caption: string) => ({
  src: `/gba-emulator/screenshot-${n}-${slug}.webp`,
  alt,
  caption,
});
const shots = [
  shot(1, "library", "GBA Emulator library screen with search, favorites, continue playing and recent games", "Your retro library"),
  shot(2, "custom-controls", "GBA Emulator custom on-screen controls in portrait and landscape", "Custom controls"),
  shot(3, "free-retro-play", "GBA Emulator overview: GBA, GBC and GB support, offline play, saves, custom controls and cheats", "Everything in one app"),
  shot(4, "works-offline", "GBA Emulator gameplay screen with a note that imported games work offline", "Works offline"),
  shot(5, "built-in-cheats", "GBA Emulator cheats screen supporting GameShark, CodeBreaker and Game Genie codes", "Built-in cheats"),
  shot(6, "save-progress", "GBA Emulator save screen with Quick Save, import, export and restore previous save", "Save your progress"),
  shot(7, "gba-gbc-gb", "GBA Emulator playing GBA, GBC and GB games from one library", "GBA, GBC & GB"),
  shot(8, "fast-flexible", "GBA Emulator speed options (1x, 2x, 4x) and Pixel Perfect or Smooth display", "Fast & flexible"),
];

const why = [
  {
    title: "Made for your patched games",
    body: "A patched .gba, .gbc or .gb file is a regular game file. Import it like any other compatible game and play it on your phone.",
    icon: <IconPatchFile />,
  },
  {
    title: "Three systems, one library",
    body: "Game Boy Advance, Game Boy Color and Game Boy games live side by side, with favorites, recent games and Continue Playing.",
    icon: <IconCartridge />,
  },
  {
    title: "Private and offline",
    body: "No account needed. Imported games, saves and your library stay on your device, and core gameplay works offline.",
    icon: <IconShieldCheck />,
  },
];

// Every item below comes from the app's Google Play description.
const features = [
  { title: "GBA, GBC & GB support", body: "Play your own compatible GBA, GBC and GB game files. Add single games or import a folder.", icon: <IconCartridge /> },
  { title: "Play offline", body: "Once your games are imported, core gameplay works without an internet connection.", icon: <IconCloudOff /> },
  { title: "Flexible saves", body: "Quick Save, Auto Resume, import and export save files, and Restore Previous Save.", icon: <IconDatabase /> },
  { title: "Customizable touch controls", body: "Move and resize the D-pad, A/B, L/R, Start/Select and Menu, with separate portrait and landscape layouts.", icon: <IconGamepad /> },
  { title: "Controller support", body: "Connect a compatible game controller and play with physical buttons.", icon: <IconSmartphone /> },
  { title: "Pixel Perfect or Smooth", body: "Pick sharp retro pixels or softer scaling, in portrait or landscape.", icon: <IconLayers /> },
  { title: "1x, 2x and 4x speed", body: "Speed through slower sections when you want to.", icon: <IconBolt /> },
  { title: "Built-in cheats", body: "Add cheat codes per game: GameShark, Action Replay, CodeBreaker and Game Genie where supported by the system.", icon: <IconPatchFile /> },
  { title: "No account required", body: "Your game files and saves are stored locally and are not uploaded to the developer's servers.", icon: <IconShieldCheck /> },
];

const steps = [
  { title: "Patch on PatchMyROM", body: "Pick your own legally-dumped ROM and the patch. It all happens in your browser.", icon: <IconPatchFile /> },
  { title: "Download the file", body: "Save the patched .gba, .gbc or .gb file to your Android phone.", icon: <IconDownloadTray /> },
  { title: "Get GBA Emulator", body: "Install it from Google Play and import the patched file into your library.", icon: <IconSmartphone /> },
  { title: "Play", body: "Set up your controls and start playing.", icon: <IconGamepad /> },
];

const faqItems = [
  {
    question: "What is GBA Emulator: Play Retro Games?",
    answer:
      "It is an Android app by Gamesira for playing your own compatible GBA, GBC and GB game files, with saves, cheats, custom touch controls and an organized game library. It is available on Google Play.",
  },
  {
    question: "Is it free?",
    answer:
      "It is free to download from Google Play. The Google Play listing says the app contains ads — check the listing for the latest details.",
  },
  {
    question: "Which systems does it support?",
    answer:
      "Game Boy Advance (GBA), Game Boy Color (GBC) and Game Boy (GB). It does not support Nintendo DS (NDS) games, so a patched .nds file will not work in it.",
  },
  {
    question: "Can I play patched ROM hacks with it?",
    answer:
      "Patch your own ROM with PatchMyROM, download the patched .gba, .gbc or .gb file, then import it into the app. Patched files are normal game files, but results can vary from hack to hack.",
  },
  {
    question: "Does it work offline?",
    answer: "Yes. Once your games are imported, core gameplay works without an internet connection.",
  },
  {
    question: "Does the app or PatchMyROM include games?",
    answer:
      "No. Neither provides games or ROM files. You must use game files you have the right to use, such as backups of games you own, plus a patch file.",
  },
  {
    question: "Is there an iPhone version?",
    answer:
      "GBA Emulator is an Android app. On iPhone or desktop you can still patch your ROM here and transfer the file to an Android device.",
  },
];

function SectionTitle({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <span className="text-xs font-semibold uppercase tracking-widest text-accent-blue">{eyebrow}</span>
      <h2 className="text-2xl font-bold text-foreground sm:text-3xl">{title}</h2>
      {intro && <p className="max-w-2xl text-muted">{intro}</p>}
    </div>
  );
}

function Screenshot({ item, priority = false, className = "" }: { item: (typeof shots)[number]; priority?: boolean; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={item.src}
      alt={item.alt}
      width={540}
      height={960}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      className={`h-auto w-full rounded-2xl border border-accent-blue/25 shadow-2xl shadow-black/40 ${className}`}
    />
  );
}

export default function GbaEmulatorPage() {
  const appJsonLd = {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    name: GBA_EMULATOR_TITLE,
    operatingSystem: "Android",
    applicationCategory: "GameApplication",
    description: DESCRIPTION,
    url: `${siteConfig.url}${GBA_EMULATOR_PAGE}`,
    installUrl: GBA_EMULATOR_URL,
    downloadUrl: GBA_EMULATOR_URL,
    image: `${siteConfig.url}/gba-emulator/icon-512.webp`,
    author: { "@type": "Organization", name: GBA_EMULATOR_DEVELOPER },
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <div className="flex flex-col gap-16 py-10 sm:gap-20 sm:py-14">
      <JsonLd data={appJsonLd} />

      {/* Hero */}
      <section className="container-page flex flex-col gap-8">
        <Breadcrumbs items={[{ href: GBA_EMULATOR_PAGE, label: GBA_EMULATOR_NAME }]} />
        <div className="relative overflow-hidden rounded-3xl border border-accent-blue/25 bg-gradient-to-br from-accent-blue/10 via-card to-accent-green/10 p-6 sm:p-10 lg:p-12">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent-blue/15 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-accent-green/10 blur-3xl" aria-hidden="true" />
          <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="flex flex-col items-center gap-5 text-center lg:items-start lg:text-left">
              <div className="flex items-center gap-4">
                <GbaEmulatorIcon size={96} alt={`${GBA_EMULATOR_TITLE} app icon`} priority className="h-20 w-20 sm:h-24 sm:w-24" />
                <div className="text-left">
                  <p className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">{GBA_EMULATOR_TITLE}</p>
                  <p className="text-sm text-accent-blue">by {GBA_EMULATOR_DEVELOPER} · Android</p>
                </div>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                Play your{" "}
                <span className="bg-gradient-to-r from-accent-green to-accent-blue bg-clip-text text-transparent">GBA, GBC &amp; GB</span>{" "}
                games on Android
              </h1>
              <p className="max-w-xl text-balance text-muted sm:text-lg">
                Patch your ROM hack on PatchMyROM, then play it on your phone with saves, cheats and custom touch
                controls. Free to download on Google Play.
              </p>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <GooglePlayButton placement="emulator_page">Get it on Google Play</GooglePlayButton>
                <ButtonLink href="/" variant="outline" className="min-h-11 w-full sm:w-auto">
                  Patch a ROM first
                  <IconArrowRight className="h-4 w-4" />
                </ButtonLink>
              </div>
              <div className="flex flex-col items-center gap-2 lg:items-start">
                <SystemChips />
                <p className="text-xs text-muted">Supports GBA, GBC and GB games. Nintendo DS games are not supported.</p>
              </div>
            </div>

            <div className="mx-auto grid w-full max-w-[17rem] grid-cols-1 gap-4 sm:max-w-md sm:grid-cols-2 lg:max-w-none">
              <Screenshot item={shots[0]} priority />
              <Screenshot item={shots[6]} className="hidden sm:block sm:mt-10" />
            </div>
          </div>
        </div>
      </section>

      <div className="container-page flex flex-col gap-16 sm:gap-20">
        {/* Why */}
        <section className="flex flex-col gap-8">
          <SectionTitle
            eyebrow="Why GBA Emulator"
            title="A simple way to play your patched games"
            intro="Most people patching GBA, GBC or GB games want to play them on their phone. This app is made for exactly that."
          />
          <div className="grid gap-4 sm:grid-cols-3">
            {why.map((item) => (
              <div key={item.title} className="card flex flex-col gap-3 rounded-2xl p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-accent-green/20 to-accent-blue/20 text-accent-green [&>svg]:h-6 [&>svg]:w-6">
                  {item.icon}
                </span>
                <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Screenshot showcase — swipeable on mobile, grid on desktop */}
      <section className="container-page flex flex-col gap-8">
        <SectionTitle eyebrow="Screenshots" title="See GBA Emulator in action" />
        <div
          role="region"
          aria-label="GBA Emulator screenshots"
          tabIndex={0}
          className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-3 focus-visible:outline-none lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0"
        >
          {shots.map((item) => (
            <figure key={item.src} className="flex w-[62%] flex-none snap-center flex-col gap-2 sm:w-[34%] lg:w-auto">
              <Screenshot item={item} />
              <figcaption className="text-center text-xs text-muted">{item.caption}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <div className="container-page flex flex-col gap-16 sm:gap-20">
        {/* Features */}
        <section className="flex flex-col gap-8">
          <SectionTitle eyebrow="Features" title="Everything you need to play" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="card flex gap-4 rounded-xl p-5">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-accent-blue/10 text-accent-blue [&>svg]:h-5 [&>svg]:w-5">
                  {feature.icon}
                </span>
                <div>
                  <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-1 text-sm text-muted">{feature.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Compatibility */}
        <section className="card flex flex-col gap-3 rounded-2xl p-6 sm:p-8" aria-labelledby="compat-heading">
          <h2 id="compat-heading" className="text-xl font-bold text-foreground sm:text-2xl">
            Which games work?
          </h2>
          <p className="text-muted">
            <span className="font-semibold text-foreground">Supported:</span> Game Boy Advance (.gba), Game Boy Color
            (.gbc) and Game Boy (.gb) game files.
          </p>
          <p className="text-muted">
            <span className="font-semibold text-foreground">Not supported:</span> Nintendo DS (.nds) games. If your
            patched file is a DS game, this app can&apos;t play it.
          </p>
        </section>

        {/* Flow */}
        <section className="flex flex-col gap-8">
          <SectionTitle
            eyebrow="How it works"
            title="From patch to play in four steps"
            intro="Neither PatchMyROM nor the app includes games — bring game files you have the right to use."
          />
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step.title} className="card relative flex flex-col gap-3 rounded-2xl p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-gradient-to-br from-accent-green to-accent-blue text-sm font-bold text-background">
                    {index + 1}
                  </span>
                  <span className="text-accent-blue [&>svg]:h-5 [&>svg]:w-5">{step.icon}</span>
                </div>
                <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
          <p className="text-center text-sm text-muted">
            New to patching? Read the{" "}
            <Link href="/gba-rom-patcher" className="text-accent-blue hover:underline">
              GBA ROM patcher guide
            </Link>
            . Check the Google Play listing for supported Android versions.
          </p>
        </section>

        {/* Final CTA */}
        <section className="relative overflow-hidden rounded-3xl border border-accent-blue/25 bg-gradient-to-br from-accent-blue/10 via-card to-accent-green/10 p-8 text-center sm:p-12">
          <div className="pointer-events-none absolute -top-20 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-accent-blue/15 blur-3xl" aria-hidden="true" />
          <div className="relative flex flex-col items-center gap-4">
            <GbaEmulatorIcon size={64} className="h-16 w-16" />
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Ready to play your patched game?</h2>
            <p className="max-w-lg text-muted">
              Get {GBA_EMULATOR_TITLE} on Google Play and take your GBA, GBC and GB games anywhere.
            </p>
            <GooglePlayButton placement="emulator_page" className="sm:w-auto">
              Get it on Google Play
            </GooglePlayButton>
          </div>
        </section>

        {/* FAQ */}
        <section className="flex flex-col gap-6">
          <SectionTitle eyebrow="FAQ" title="Frequently asked questions" />
          <FaqAccordion items={faqItems} />
        </section>

        <section className="flex flex-col gap-4">
          <SectionTitle eyebrow="Keep exploring" title="Related guides" />
          <RelatedGuides
            items={[
              { href: "/", title: "ROM Patcher", description: "Patch a ROM file directly in your browser." },
              { href: "/gba-rom-patcher", title: "GBA ROM Patcher", description: "Patch Game Boy Advance ROMs with IPS, UPS or BPS." },
              { href: "/gbc-rom-patcher", title: "GBC ROM Patcher", description: "Patch Game Boy Color ROMs and keep the header valid." },
              { href: "/how-to-patch-pokemon-rom-hacks", title: "How to Patch Pokemon ROM Hacks", description: "Step-by-step patching walkthrough." },
            ]}
          />
        </section>

        <p className="text-xs text-muted">
          PatchMyROM does not provide ROM files. GBA Emulator: Play Retro Games is an Android app by {GBA_EMULATOR_DEVELOPER}; the
          Google Play listing states it contains ads and is not affiliated with or endorsed by Nintendo. Google Play is a
          trademark of Google LLC.
        </p>
      </div>
    </div>
  );
}
