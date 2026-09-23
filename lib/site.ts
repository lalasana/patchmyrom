export const siteConfig = {
  name: "PatchMyROM",
  title: "PatchMyROM — Free Online ROM Patcher (IPS, UPS, BPS, xdelta)",
  description:
    "Patch ROM files directly in your browser with IPS, UPS, BPS, and xdelta patches. Nothing is uploaded — all patching happens locally on your device.",
  url: "https://patchmyrom.com",
  domain: "patchmyrom.com",
  ogImage: "/og-image.png",
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

export const navLinks = [
  { href: "/pokemon-rom-patcher", label: "Pokemon ROM Patcher" },
  { href: "/patch-formats", label: "Patch Formats" },
  { href: "/how-to-patch-pokemon-rom-hacks", label: "How to Patch" },
  { href: "/troubleshooting", label: "Troubleshooting" },
  { href: "/about", label: "About" },
] as const;

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
  ],
  formats: patchFormatPages,
  consoles: consolePatcherPages,
  guides: [
    { href: "/how-to-patch-pokemon-rom-hacks", label: "How to Patch Pokemon ROM Hacks" },
    { href: "/gba-play", label: "GBA Play (Android emulator)" },
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
