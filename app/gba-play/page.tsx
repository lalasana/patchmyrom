import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import FaqAccordion from "@/components/ui/FaqAccordion";
import RelatedGuides from "@/components/ui/RelatedGuides";
import JsonLd from "@/components/seo/JsonLd";
import GbaPlayIcon from "@/components/ui/GbaPlayIcon";
import { GooglePlayButton } from "@/components/ui/GbaPlayCta";
import { ButtonLink } from "@/components/ui/Button";
import {
  IconArrowRight,
  IconCartridge,
  IconDownloadTray,
  IconGamepad,
  IconInfo,
  IconLayers,
  IconPatchFile,
  IconPlay,
  IconSmartphone,
} from "@/components/ui/icons";
import { GBA_PLAY_NAME, GBA_PLAY_URL } from "@/lib/gba-play";
import { buildPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata({
  title: "GBA Play — Best GBA Emulator for Android",
  description:
    "GBA Play is our recommended GBA emulator for Android: touch controls, a game library, save states, and an easy way to play your patched ROM hacks. Get it on Google Play.",
  path: "/gba-play",
});

// Screenshots live in /public/gba-play (replace files, keep names). The app icon is icon-{48,64,96,128,160,192,320,512}.webp.
const shots = {
  controls: {
    src: "/gba-play/gba-play-touch-controls.webp",
    alt: "GBA Play gameplay screen with on-screen D-pad, A/B, L/R, Start and Select touch controls",
    caption: "Touch controls",
  },
  library: {
    src: "/gba-play/gba-play-game-library.webp",
    alt: "GBA Play game library with search, sort, favorites and category filters",
    caption: "Game library",
  },
  home: {
    src: "/gba-play/gba-play-home.webp",
    alt: "GBA Play home screen with continue playing, import ROM, patch game and favorites",
    caption: "Home",
  },
  layout: {
    src: "/gba-play/gba-play-choose-controls.webp",
    alt: "GBA Play control setup screen offering a D-pad or analog stick layout",
    caption: "D-pad or analog stick",
  },
  languages: {
    src: "/gba-play/gba-play-languages.webp",
    alt: "GBA Play welcome screen with English, Spanish, French, German and Brazilian Portuguese language options",
    caption: "Multiple languages",
  },
};
const showcase = [shots.controls, shots.library, shots.home, shots.layout, shots.languages];

const why = [
  {
    title: "Made for phones",
    body: "Comfortable on-screen controls, a D-pad or analog stick of your choice, and a fast-forward toggle within thumb reach.",
    icon: <IconSmartphone />,
  },
  {
    title: "Made for ROM hacks",
    body: "A searchable library with favorites and filters keeps every hack you're working through easy to find again.",
    icon: <IconCartridge />,
  },
  {
    title: "Made to get you playing",
    body: "Quick setup, import and patch actions right on the home screen, and save tools that let you rewind and resume.",
    icon: <IconPlay />,
  },
];

const features = [
  { title: "Responsive touch controls", body: "On-screen D-pad, A/B, L/R, Start and Select with a fast-forward toggle.", icon: <IconGamepad /> },
  { title: "D-pad or analog stick", body: "Pick your layout during setup and switch any time in Settings.", icon: <IconSmartphone /> },
  { title: "Smart game library", body: "Search, sort, favorite and filter your collection.", icon: <IconCartridge /> },
  { title: "Save timeline", body: "Save, rewind and pick up where you left off.", icon: <IconLayers /> },
  { title: "Import & patch in the app", body: "Quick actions for importing a ROM and patching a game.", icon: <IconPatchFile /> },
  { title: "Control themes & languages", body: "Customize your controls, in English, Español, Français, Deutsch or Português (Brasil).", icon: <IconInfo /> },
];

const steps = [
  { title: "Patch on PatchMyROM", body: "Pick your own legally-dumped ROM and the IPS, UPS or BPS patch. It all happens in your browser.", icon: <IconPatchFile /> },
  { title: "Download the file", body: "Save the patched .gba file to your Android phone.", icon: <IconDownloadTray /> },
  { title: "Get GBA Play", body: "Install it from Google Play and import the patched file into your library.", icon: <IconSmartphone /> },
  { title: "Play", body: "Choose your controls and start playing your ROM hack.", icon: <IconGamepad /> },
];

const faqItems = [
  {
    question: "What is GBA Play?",
    answer:
      "GBA Play is an Android emulator for Game Boy Advance games, with touch controls, a game library and save features. It is available on Google Play.",
  },
  {
    question: "Why does PatchMyROM recommend GBA Play?",
    answer:
      "PatchMyROM creates patched ROM files, and GBA Play is a phone-friendly way to play them. Both are built with the same goal: an easy path from a patch to a playable game.",
  },
  {
    question: "Can I play patched GBA ROM hacks with GBA Play?",
    answer:
      "Yes. Patch your own ROM with PatchMyROM, download the patched .gba file, then import it into GBA Play on your Android device.",
  },
  {
    question: "Does GBA Play or PatchMyROM include games?",
    answer:
      "No. Neither provides commercial ROMs. You need your own legally-dumped backups of games you own, plus a patch file.",
  },
  {
    question: "Is there an iPhone version?",
    answer:
      "GBA Play is an Android app. On iPhone or desktop you can still patch your ROM here and transfer the file to an Android device.",
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

function Screenshot({ shot, priority = false, className = "" }: { shot: (typeof showcase)[number]; priority?: boolean; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={shot.src}
      alt={shot.alt}
      width={810}
      height={1440}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      className={`h-auto w-full rounded-2xl border border-accent-blue/25 shadow-2xl shadow-black/40 ${className}`}
    />
  );
}

export default function GbaPlayPage() {
  const appJsonLd = {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    name: GBA_PLAY_NAME,
    operatingSystem: "Android",
    applicationCategory: "GameApplication",
    description: "Android emulator for Game Boy Advance games with touch controls, a game library and save features.",
    url: GBA_PLAY_URL,
    image: `${siteConfig.url}/gba-play/icon-512.webp`,
  };

  return (
    <div className="flex flex-col gap-16 py-10 sm:gap-20 sm:py-14">
      <JsonLd data={appJsonLd} />

      {/* Hero */}
      <section className="container-page flex flex-col gap-8">
        <Breadcrumbs items={[{ href: "/gba-play", label: "GBA Play" }]} />
        <div className="relative overflow-hidden rounded-3xl border border-accent-blue/25 bg-gradient-to-br from-accent-blue/10 via-card to-purple-500/10 p-6 sm:p-10 lg:p-12">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent-blue/15 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-purple-500/15 blur-3xl" aria-hidden="true" />
          <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="flex flex-col items-center gap-5 text-center lg:items-start lg:text-left">
              <div className="flex items-center gap-4">
                <GbaPlayIcon size={96} alt="GBA Play app icon" priority className="h-20 w-20 sm:h-24 sm:w-24" />
                <div className="text-left">
                  <p className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{GBA_PLAY_NAME}</p>
                  <p className="text-sm text-accent-blue">Retro Emulator for Android</p>
                </div>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                The{" "}
                <span className="bg-gradient-to-r from-accent-green to-accent-blue bg-clip-text text-transparent">Best GBA Emulator</span>{" "}
                for Android
              </h1>
              <p className="max-w-xl text-balance text-muted sm:text-lg">
                Classic gameplay, modern controls. Patch your ROM hack on PatchMyROM, then play it on your phone with
                GBA Play.
              </p>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <GooglePlayButton placement="gba_play_page">Get it on Google Play</GooglePlayButton>
                <ButtonLink href="/" variant="outline" className="min-h-11 w-full sm:w-auto">
                  Patch a ROM first
                  <IconArrowRight className="h-4 w-4" />
                </ButtonLink>
              </div>
              <ul className="flex flex-wrap justify-center gap-2 text-xs text-muted lg:justify-start">
                {["Android", "Touch controls", "Game library", "Save timeline"].map((chip) => (
                  <li key={chip} className="rounded-full border border-border bg-background/40 px-3 py-1">
                    {chip}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mx-auto grid w-full max-w-[17rem] grid-cols-1 gap-4 sm:max-w-md sm:grid-cols-2 lg:max-w-none">
              <Screenshot shot={shots.controls} priority />
              <Screenshot shot={shots.library} className="hidden sm:block sm:mt-10" />
            </div>
          </div>
        </div>
      </section>

      <div className="container-page flex flex-col gap-16 sm:gap-20">
        {/* Why GBA Play */}
        <section className="flex flex-col gap-8">
          <SectionTitle
            eyebrow="Why GBA Play"
            title="Built for playing your patched games"
            intro="Most people patching GBA ROM hacks want to play on their phone. GBA Play is made for exactly that."
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
        <SectionTitle eyebrow="Screenshots" title="See GBA Play in action" />
        <div
          role="region"
          aria-label="GBA Play screenshots"
          tabIndex={0}
          className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-3 focus-visible:outline-none lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0"
        >
          {showcase.map((shot) => (
            <figure key={shot.src} className="flex w-[62%] flex-none snap-center flex-col gap-2 sm:w-[34%] lg:w-auto">
              <Screenshot shot={shot} />
              <figcaption className="text-center text-xs text-muted">{shot.caption}</figcaption>
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

        {/* Flow */}
        <section className="flex flex-col gap-8">
          <SectionTitle
            eyebrow="How it works"
            title="From patch to play in four steps"
            intro="GBA Play does not include games — bring your own legally obtained backups."
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
            <GbaPlayIcon size={64} className="h-16 w-16" />
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Ready to play your patched ROM?</h2>
            <p className="max-w-lg text-muted">Get GBA Play on Google Play and take your ROM hacks anywhere.</p>
            <GooglePlayButton placement="gba_play_page" className="sm:w-auto">
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
              { href: "/pokemon-rom-patcher", title: "Pokemon ROM Patcher", description: "Base ROM reference for popular Pokemon ROM hacks." },
              { href: "/how-to-patch-pokemon-rom-hacks", title: "How to Patch Pokemon ROM Hacks", description: "Step-by-step patching walkthrough." },
            ]}
          />
        </section>

        <p className="text-xs text-muted">
          PatchMyROM does not provide ROM files. GBA Play is an Android app; Google Play is a trademark of Google LLC.
        </p>
      </div>
    </div>
  );
}
