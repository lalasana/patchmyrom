import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import FaqAccordion from "@/components/ui/FaqAccordion";
import SectionHeading from "@/components/ui/SectionHeading";
import RelatedGuides from "@/components/ui/RelatedGuides";
import JsonLd from "@/components/seo/JsonLd";
import { GooglePlayButton } from "@/components/ui/GbaPlayCta";
import { ButtonLink } from "@/components/ui/Button";
import {
  IconArrowRight,
  IconCartridge,
  IconGamepad,
  IconInfo,
  IconLayers,
  IconPatchFile,
  IconPlay,
  IconSmartphone,
} from "@/components/ui/icons";
import { GBA_PLAY_NAME, GBA_PLAY_URL } from "@/lib/gba-play";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "GBA Play — Best GBA Emulator for Android",
  description:
    "GBA Play is our recommended GBA emulator for Android: touch controls, a game library, save states, and an easy way to play your patched ROM hacks. Get it on Google Play.",
  path: "/gba-play",
});

// Screenshots live in /public/gba-play. Replace the files (same names) to update them.
const screenshots = [
  {
    src: "/gba-play/gba-play-touch-controls.webp",
    alt: "GBA Play gameplay screen with on-screen D-pad, A/B, L/R, Start and Select touch controls",
    caption: "Touch controls",
  },
  {
    src: "/gba-play/gba-play-game-library.webp",
    alt: "GBA Play game library with search, sort, favorites and category filters",
    caption: "Game library",
  },
  {
    src: "/gba-play/gba-play-home.webp",
    alt: "GBA Play home screen with continue playing, import ROM, patch game and favorites",
    caption: "Home",
  },
  {
    src: "/gba-play/gba-play-choose-controls.webp",
    alt: "GBA Play control setup screen offering a D-pad or analog stick layout",
    caption: "D-pad or analog stick",
  },
  {
    src: "/gba-play/gba-play-languages.webp",
    alt: "GBA Play welcome screen with English, Spanish, French, German and Brazilian Portuguese language options",
    caption: "Multiple languages",
  },
];

const features = [
  {
    title: "Responsive touch controls",
    body: "On-screen D-pad, A/B, L/R, Start and Select built for phones, with a fast-forward toggle within reach.",
    icon: <IconGamepad />,
  },
  {
    title: "D-pad or analog stick",
    body: "Pick the layout you prefer during setup and switch any time in Settings.",
    icon: <IconSmartphone />,
  },
  {
    title: "Smart game library",
    body: "Search, sort, favorite and filter your collection so your ROM hacks are easy to find again.",
    icon: <IconCartridge />,
  },
  {
    title: "Save timeline",
    body: "Save, rewind and pick up where you left off — handy when testing a fresh hack.",
    icon: <IconLayers />,
  },
  {
    title: "Import & patch in the app",
    body: "Quick actions for importing a ROM and patching a game, right from the home screen.",
    icon: <IconPatchFile />,
  },
  {
    title: "Control themes & languages",
    body: "Customize how the controls look, and use the app in English, Español, Français, Deutsch or Português (Brasil).",
    icon: <IconInfo />,
  },
];

const steps = [
  {
    title: "Patch your ROM on PatchMyROM",
    body: "Select your own legally-dumped ROM and the IPS, UPS or BPS patch. Everything happens in your browser.",
  },
  {
    title: "Download the patched file",
    body: "Save the patched .gba file to your Android phone.",
  },
  {
    title: "Install GBA Play",
    body: "Get it from Google Play, then import the patched file into your library.",
  },
  {
    title: "Play",
    body: "Pick your controls and start playing your ROM hack.",
  },
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

export default function GbaPlayPage() {
  const appJsonLd = {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    name: GBA_PLAY_NAME,
    operatingSystem: "Android",
    applicationCategory: "GameApplication",
    description: "Android emulator for Game Boy Advance games with touch controls, a game library and save features.",
    url: GBA_PLAY_URL,
  };

  return (
    <div className="container-page flex flex-col gap-14 py-10 sm:py-14">
      <JsonLd data={appJsonLd} />
      <Breadcrumbs items={[{ href: "/gba-play", label: "GBA Play" }]} />

      {/* Hero */}
      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            {/* TODO: replace this placeholder tile with the final GBA Play app icon (e.g. /gba-play/icon.webp). */}
            <span
              role="img"
              aria-label="GBA Play app icon"
              className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-accent-blue to-accent-green text-background shadow-lg shadow-accent-blue/20"
            >
              <IconPlay className="h-8 w-8" />
            </span>
            <span className="text-sm font-medium text-accent-blue">Recommended by PatchMyROM</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            GBA Play — <span className="bg-gradient-to-r from-accent-green to-accent-blue bg-clip-text text-transparent">Best GBA Emulator</span> for Android
          </h1>
          <p className="max-w-xl text-muted sm:text-lg">
            Classic gameplay with modern controls. Patch a ROM hack on PatchMyROM, then play it on your
            Android phone with GBA Play.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <GooglePlayButton placement="gba_play_page">Get it on Google Play</GooglePlayButton>
            <ButtonLink href="/" variant="outline" className="min-h-11 w-full sm:w-auto">
              Patch a ROM first
              <IconArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </div>
        <div className="mx-auto w-full max-w-xs lg:max-w-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/gba-play/gba-play-touch-controls.webp"
            alt="GBA Play running a game with on-screen touch controls on an Android phone"
            width={810}
            height={1440}
            fetchPriority="high"
            className="h-auto w-full rounded-2xl border border-border"
          />
        </div>
      </section>

      {/* Why GBA Play */}
      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconInfo />} title="Why GBA Play" accent="blue" />
        <div className="rounded-xl border-l-4 border-accent-blue/40 bg-card/40 p-5">
          <p className="max-w-3xl text-muted">
            Most people patching GBA ROM hacks end up wanting to play on their phone. GBA Play is built
            for exactly that: comfortable touch controls, a library that keeps your hacks organized, and
            quick setup so you spend your time playing, not configuring.
          </p>
        </div>
      </section>

      {/* Key features */}
      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconGamepad />} title="Key Features" accent="green" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="card flex flex-col gap-2 rounded-xl p-5">
              <span className="text-accent-green [&>svg]:h-6 [&>svg]:w-6">{feature.icon}</span>
              <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Best for patched ROMs */}
      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconPatchFile />} title="Best for Patched ROMs" accent="purple" />
        <div className="rounded-xl border-l-4 border-purple-500/40 bg-card/40 p-5">
          <p className="max-w-3xl text-muted">
            Patched ROMs are ordinary .gba files, so they load like any other game. GBA Play adds the
            things ROM-hack players lean on: a searchable library, favorites for the hacks you&apos;re
            working through, and save/rewind tools for when a new hack gets tough. It also includes
            in-app import and patch actions. GBA Play does not include games — bring your own legally
            obtained backups.
          </p>
        </div>
      </section>

      {/* How to use with PatchMyROM */}
      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconLayers />} title="How to Use GBA Play with PatchMyROM" accent="blue" />
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
      </section>

      {/* Screenshots */}
      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconSmartphone />} title="Screenshots" accent="green" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {screenshots.map((shot) => (
            <figure key={shot.src} className="flex flex-col gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={shot.src}
                alt={shot.alt}
                width={810}
                height={1440}
                loading="lazy"
                decoding="async"
                className="h-auto w-full rounded-xl border border-border"
              />
              <figcaption className="text-center text-xs text-muted">{shot.caption}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Compatibility */}
      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconCartridge />} title="Compatibility" accent="amber" />
        <div className="rounded-xl border-l-4 border-amber-500/40 bg-card/40 p-5">
          <p className="max-w-3xl text-muted">
            GBA Play is built for Game Boy Advance games on Android devices. Check the Google Play
            listing for the current supported Android versions and device requirements. Patch formats
            are handled by PatchMyROM — see the{" "}
            <Link href="/gba-rom-patcher" className="text-accent-blue hover:underline">
              GBA ROM patcher guide
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Download CTA */}
      <section className="card flex flex-col items-center gap-4 rounded-2xl p-6 text-center sm:p-8">
        <h2 className="text-2xl font-bold text-foreground">Download GBA Play on Google Play</h2>
        <p className="max-w-xl text-sm text-muted">
          Patch your ROM here, then play it on Android with GBA Play.
        </p>
        <GooglePlayButton placement="gba_play_page" className="sm:w-auto">
          Get it on Google Play
        </GooglePlayButton>
      </section>

      {/* FAQ */}
      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconInfo />} title="FAQ" accent="blue" />
        <FaqAccordion items={faqItems} />
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading icon={<IconLayers />} title="Related Guides" accent="blue" />
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
        PatchMyROM does not provide ROM files. GBA Play is an Android app; Google Play is a trademark of
        Google LLC.
      </p>
    </div>
  );
}
