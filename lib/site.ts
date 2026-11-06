export const siteConfig = {
  name: "PatchMyROM",
  title: "PatchMyROM — Free Online ROM Patcher (IPS, UPS, BPS, xdelta)",
  description:
    "Patch ROM files directly in your browser with IPS, UPS, BPS, and xdelta patches. Nothing is uploaded — all patching happens locally on your device.",
  url: "https://patchmyrom.com",
  domain: "patchmyrom.com",
  ogImage: "/og-image.png",
  logo: "/brand/patchmyrom-logo.webp",
  logoSquare: "/brand/icon-512.png",
  keywords: [
    "ROM patcher",
    "IPS patcher",
    "UPS patcher",
    "BPS patcher",
    "xdelta patcher",
    "Pokemon ROM hack patcher",
    "GBA ROM patcher",
    "patch ROM online",
  ],
  contactEmail: "contact@patchmyrom.com",
  social: {
    twitter: "",
    github: "",
  },
} as const;

export type NavItem = {
  href: string;
  label: string;
  /** One short line shown under the label in the menus. */
  hint: string;
  /** 2-4 letter tile shown next to the item. */
  badge: string;
};

export type NavGroup = {
  id: "consoles" | "formats" | "tools" | "guides";
  label: string;
  /** Accent used for the group's menu (maps to a class set in the nav components). */
  accent: "purple" | "green" | "blue" | "amber";
  items: readonly NavItem[];
};

/** Header navigation: the general patcher plus four grouped menus. Legal and secondary pages live in the footer. */
export const mainNav: { home: { href: string; label: string }; groups: readonly NavGroup[] } = {
  home: { href: "/", label: "ROM Patcher" },
  groups: [
    {
      id: "consoles",
      label: "Consoles",
      accent: "purple",
      items: [
        { href: "/gba-rom-patcher", label: "GBA ROM Patcher", hint: ".gba files · IPS, UPS, BPS", badge: "GBA" },
        { href: "/nds-rom-patcher", label: "NDS ROM Patcher", hint: ".nds files · xdelta, large ROMs", badge: "NDS" },
        { href: "/gbc-rom-patcher", label: "GBC ROM Patcher", hint: ".gb/.gbc · header checksum", badge: "GBC" },
        { href: "/nes-rom-patcher", label: "NES ROM Patcher", hint: ".nes files · iNES header", badge: "NES" },
        { href: "/snes-rom-patcher", label: "SNES ROM Patcher", hint: ".sfc/.smc · copier header", badge: "SNES" },
      ],
    },
    {
      id: "formats",
      label: "Patch Formats",
      accent: "green",
      items: [
        { href: "/ips-patcher", label: "IPS Patcher", hint: "Simple, no source check", badge: "IPS" },
        { href: "/ups-patcher", label: "UPS Patcher", hint: "Source and output CRC32", badge: "UPS" },
        { href: "/bps-patcher", label: "BPS Patcher", hint: "Checksum-verified patches", badge: "BPS" },
        { href: "/xdelta-patcher", label: "xdelta Patcher", hint: "Large files, VCDIFF", badge: "XD" },
      ],
    },
    {
      id: "tools",
      label: "Tools",
      accent: "blue",
      items: [
        { href: "/rom-checksum-checker", label: "ROM Checksum Checker", hint: "CRC32, MD5, SHA-1, SHA-256", badge: "CRC" },
        { href: "/patch-compatibility-checker", label: "Patch Compatibility Checker", hint: "Will this patch work?", badge: "OK?" },
        { href: "/pokemon-rom-patcher", label: "Pokémon ROM Patcher", hint: "Base ROMs for 50 hacks", badge: "PKM" },
      ],
    },
    {
      id: "guides",
      label: "Guides",
      accent: "amber",
      items: [
        { href: "/how-to-patch-pokemon-rom-hacks", label: "How to Patch Pokémon ROM Hacks", hint: "Step-by-step guide", badge: "HOW" },
        { href: "/patch-formats", label: "Patch Formats Explained", hint: "IPS vs UPS vs BPS vs xdelta", badge: "FMT" },
        { href: "/troubleshooting", label: "Troubleshooting", hint: "Common errors and fixes", badge: "FIX" },
      ],
    },
  ],
};

/** Dedicated per-format landing pages — single source of truth for footer, sitemap, and cross-linking. */
export const patchFormatPages = [
  { href: "/ips-patcher", label: "IPS Patcher" },
  { href: "/bps-patcher", label: "BPS Patcher" },
  { href: "/ups-patcher", label: "UPS Patcher" },
  { href: "/xdelta-patcher", label: "xdelta Patcher" },
] as const;

/** Dedicated per-console landing pages — single source of truth for footer, sitemap, and cross-linking. */
export const consolePatcherPages = [
  { href: "/gba-rom-patcher", label: "GBA ROM Patcher" },
  { href: "/nds-rom-patcher", label: "NDS ROM Patcher" },
  { href: "/gbc-rom-patcher", label: "GBC ROM Patcher" },
  { href: "/nes-rom-patcher", label: "NES ROM Patcher" },
  { href: "/snes-rom-patcher", label: "SNES ROM Patcher" },
] as const;

export const footerLinks = {
  tool: [
    { href: "/", label: "ROM Patcher" },
    { href: "/pokemon-rom-patcher", label: "Pokemon ROM Patcher" },
    { href: "/patch-formats", label: "Patch Formats" },
    { href: "/rom-checksum-checker", label: "ROM Checksum Checker" },
    { href: "/patch-compatibility-checker", label: "Patch Compatibility Checker" },
  ],
  formats: patchFormatPages,
  consoles: consolePatcherPages,
  guides: [
    { href: "/how-to-patch-pokemon-rom-hacks", label: "How to Patch Pokemon ROM Hacks" },
    { href: "/gba-emulator", label: "GBA Emulator (Android)" },
    { href: "/troubleshooting", label: "Troubleshooting" },
    { href: "/changelog", label: "Changelog" },
  ],
  legal: [
    { href: "/about", label: "About" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Use" },
    { href: "/disclaimer", label: "Disclaimer" },
    { href: "/dmca", label: "DMCA" },
    { href: "/contact", label: "Contact" },
  ],
} as const;
