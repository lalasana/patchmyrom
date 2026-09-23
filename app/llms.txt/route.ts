import { siteConfig } from "@/lib/site";

export const dynamic = "force-static";

// Curated, hand-written index for AI agents deciding what to fetch next —
// deliberately not a full sitemap dump. Descriptions are plain and factual,
// written for a machine picking a page, not for search-result copy.
type LlmsEntry = { path: string; description: string };

type LlmsSection = { heading: string; entries: LlmsEntry[] };

const sections: LlmsSection[] = [
  {
    heading: "Core tool",
    entries: [
      { path: "/", description: "The ROM patcher itself. Applies an IPS, UPS, BPS, or xdelta patch to a ROM file entirely in the browser; nothing is uploaded." },
      { path: "/patch-formats", description: "Comparison of IPS, UPS, BPS, and xdelta patch formats, and which one a given patch is likely to be." },
    ],
  },
  {
    heading: "Patch format guides",
    entries: [
      { path: "/ips-patcher", description: "How to apply an .ips patch, including its 16MB size limit and lack of checksum verification." },
      { path: "/bps-patcher", description: "How to apply a .bps patch, which verifies both the source and target ROM checksums before completing." },
      { path: "/ups-patcher", description: "How to apply a .ups patch, a checksum-verified format common in fan translation projects." },
      { path: "/xdelta-patcher", description: "How to apply an .xdelta (VCDIFF) patch, a general-purpose diff format used for large ROMs." },
    ],
  },
  {
    heading: "Console-specific guides",
    entries: [
      { path: "/gba-rom-patcher", description: "Patching Game Boy Advance ROMs, which typically use IPS, UPS, or BPS patches." },
      { path: "/nds-rom-patcher", description: "Patching Nintendo DS ROMs, which are large (32MB-500MB+) and typically use xdelta patches." },
      { path: "/gbc-rom-patcher", description: "Patching Game Boy and Game Boy Color ROMs, including the cartridge header checksum fix." },
      { path: "/nes-rom-patcher", description: "Patching NES ROMs, IPS's original home platform." },
      { path: "/snes-rom-patcher", description: "Patching SNES ROMs, including the 512-byte copier header some dumps carry." },
    ],
  },
  {
    heading: "Pokemon ROM hacks",
    entries: [
      { path: "/pokemon-rom-patcher", description: "Base ROM reference table for 50 popular Pokemon ROM hacks, with required base game and patch format." },
      { path: "/how-to-patch-pokemon-rom-hacks", description: "Step-by-step walkthrough for patching a Pokemon ROM hack specifically." },
    ],
  },
  {
    heading: "Recommended app",
    entries: [
      { path: "/gba-play", description: "GBA Play, the Android Game Boy Advance emulator PatchMyROM recommends for playing patched ROMs; links to Google Play." },
    ],
  },
  {
    heading: "Support",
    entries: [
      { path: "/troubleshooting", description: "Fixes for common ROM patching errors: checksum mismatches, wrong ROM versions, patches that won't apply." },
    ],
  },
];

function buildLlmsTxt(): string {
  const lines: string[] = [
    `# ${siteConfig.name}`,
    "",
    `> ${siteConfig.description}`,
    "",
  ];

  for (const section of sections) {
    lines.push(`## ${section.heading}`, "");
    for (const entry of section.entries) {
      lines.push(`- [${siteConfig.url}${entry.path}](${siteConfig.url}${entry.path}): ${entry.description}`);
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd() + "\n";
}

export function GET() {
  return new Response(buildLlmsTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
