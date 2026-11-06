import type { Metadata } from "next";
import ToolPage from "@/components/tool/ToolPage";
import InlineLink from "@/components/ui/InlineLink";
import { IconShieldCheck } from "@/components/ui/icons";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "GBC ROM Patcher — Patch Game Boy Color ROMs Online",
  description:
    "Apply IPS, UPS or BPS patches to a Game Boy or Game Boy Color ROM in your browser. IPS results get their header checksum recalculated. Nothing is uploaded.",
  path: "/gbc-rom-patcher",
});

export default function GbcRomPatcherPage() {
  return (
    <ToolPage
      path="/gbc-rom-patcher"
      breadcrumbLabel="GBC ROM Patcher"
      accent="green"
      title="GBC ROM Patcher"
      intro={
        <p>
          Game Boy and Game Boy Color ROMs patch the same way. Apply your IPS, UPS or BPS file right here;
          for IPS patches the tool also repairs the cartridge header checksum, which is the detail that
          usually trips people up.
        </p>
      }
      chips={["IPS", "UPS", "BPS"]}
      platform="gbc"
      kicker="Game Boy / Game Boy Color · .gb .gbc"
      facts={[
        { label: "File types", value: ".gb · .gbc", note: "same patching, different base ROMs" },
        { label: "Header checksum", value: "byte 0x14D", note: "covers header bytes 0x134-0x14C" },
        { label: "Repaired for", value: "IPS only", note: "UPS and BPS define the exact output" },
        { label: "Repair needs", value: "valid logo", note: "and a whole number of 16 KB banks" },
      ]}
      diagram={{
        title: "Where the checksum lives",
        caption: "The console's boot code compares the byte at 0x14D with a sum of 0x134-0x14C. PatchMyROM recalculates just that byte after an IPS patch; the global checksum at 0x14E-0x14F is not touched.",
        rows: [
          { label: "Cartridge header, 0x100-0x14F", segments: [{ label: "Entry point", sub: "0x100" }, { label: "Nintendo logo", sub: "0x104", grow: 3 }, { label: "Title, CGB flag", sub: "0x134", grow: 2 }, { label: "Licensee, type, sizes, version", sub: "0x144-0x14C", grow: 3 }, { label: "Header checksum", sub: "0x14D", grow: 2, tone: "accent" }, { label: "Global checksum", sub: "0x14E", grow: 2, tone: "muted" }] },
          { label: "Fixed automatically?", segments: [{ label: "IPS", sub: "Yes, byte 0x14D", tone: "ok" }, { label: "UPS", sub: "No, exact output", tone: "muted" }, { label: "BPS", sub: "No, exact output", tone: "muted" }] },
        ],
      }}
      patcher={{
        heading: "Patch a GB / GBC ROM",
        romLabel: "Original GB or GBC ROM",
        romHint: "Your own .gb or .gbc dump",
        patchHint: "Usually .ips or .ups; .bps works too",
      }}
      verify={
        <>
          <p>
            Many Game Boy games exist as separate GB and GBC releases with different data, so confirm which
            one the patch wants. The <InlineLink href="/rom-checksum-checker">ROM Checksum Checker</InlineLink>{" "}
            reads the cartridge header and reports whether your file is Game Boy, Game Boy Color or dual-mode,
            along with its CRC32, MD5, SHA-1 and SHA-256.
          </p>
          <p>
            UPS and BPS patches store the checksum of the ROM they need. The{" "}
            <InlineLink href="/patch-compatibility-checker">Patch Compatibility Checker</InlineLink>{" "}compares it
            with your file before you patch; IPS carries no checksum, so it can only say it cannot verify.
          </p>
        </>
      }
      feature={{
        icon: <IconShieldCheck />,
        title: "The Header Checksum Quirk",
        accent: "green",
        body: (
          <>
            <p>
              A Game Boy cartridge header ends with a one-byte checksum (at 0x14D) of the header fields
              before it. If a patch changes those fields, for example the title, the stored byte goes
              stale, and a strict emulator or a real console can refuse the ROM.
            </p>
            <p>
              After an IPS patch, PatchMyROM recalculates that byte. This applies when the file is named
              .gb or .gbc, is a whole number of 16 KB banks and has a valid Nintendo logo in its header.
              Only that one checksum byte is touched.
            </p>
            <p>
              UPS and BPS patches are different. They define the output byte for byte and the patcher
              verifies it against the checksum stored in the patch, so it deliberately leaves the header
              alone; if the author wanted a changed checksum, it is already in the patch.
            </p>
          </>
        ),
      }}
      howTo={{
        name: "How to Patch a Game Boy Color ROM",
        description: "Steps to apply an IPS, UPS or BPS patch to a Game Boy or Game Boy Color ROM using a browser-based patcher.",
        steps: [
          {
            title: "Start from a clean .gb or .gbc file",
            body: "Patches are built against either the GB or the GBC release of a game, so use the one the patch names.",
          },
          {
            title: "Get the patch",
            body: "Usually an .ips or .ups file for a particular release of the original game. BPS also works.",
          },
          {
            title: "Select both files",
            body: "Keep the .gb or .gbc extension on your ROM; the checksum repair only runs for those.",
          },
          {
            title: "Download the patched ROM",
            body: "For IPS the header checksum is already corrected. For UPS and BPS the file is exactly what the patch defines.",
          },
        ],
      }}
      mistakesTitle="Mistakes That Trip Up GBC Patching"
      mistakes={[
        {
          problem: "Confusing a GB-only game with a GBC-enhanced one",
          solution:
            "Some games have separate Game Boy and Game Boy Color releases with different data. A patch built for one will not line up with the other.",
        },
        {
          problem: "Renaming the ROM to something other than .gb or .gbc",
          solution:
            "The header checksum repair only runs on .gb and .gbc files, so an IPS result from a file named .bin keeps whatever checksum the patch left.",
        },
        {
          problem: "Patching a save-state or combined export instead of a plain dump",
          solution:
            "Patches expect the game data on its own. Use the plain ROM dump, not an emulator export.",
        },
      ]}
      troubleshooting={[
        {
          problem: "Real hardware or a strict emulator refuses to boot the patched ROM",
          solution:
            "Check the file extension and the patch format. After an IPS patch on a .gb or .gbc file the header checksum is already repaired, so look next at the base ROM revision.",
        },
        {
          problem: "Patch is rejected outright",
          solution:
            "For UPS and BPS this points to a base ROM mismatch. Double-check you have the exact release the patch was built against; the message names the CRC32 it expects.",
        },
        {
          problem: "Colors look wrong on a Game Boy Color patch",
          solution:
            "Run it on a GBC-capable emulator or hardware. A GBC-enhanced ROM run in a GB-only mode loses its color palette.",
        },
      ]}
      faq={[
        {
          question: "What's the difference between patching for GB and GBC?",
          answer:
            "The process is identical. What differs is which original ROM the patch expects, because a Game Boy Color release often has different data than the original Game Boy one.",
        },
        {
          question: "Why does a header checksum matter for Game Boy ROMs?",
          answer:
            "The header stores a checksum of its own fields that the console's boot code checks. If a patch changes those fields without updating it, real hardware and some stricter emulators can refuse the ROM.",
        },
        {
          question: "Which patch formats show up for GB/GBC hacks?",
          answer:
            "Mostly IPS and UPS, with some BPS. These ROMs are small, so IPS's 16 MB limit rarely matters.",
        },
        {
          question: "Does this patcher fix the header checksum for me?",
          answer:
            "For IPS patches on .gb and .gbc files with a valid header, yes. For UPS and BPS it does not, because those patches define the exact output and are verified against it.",
        },
      ]}
      related={[
        { href: "/", title: "ROM Patcher", description: "The general-purpose patcher for any console." },
        { href: "/ips-patcher", title: "IPS Patcher", description: "How IPS works and where its limits are." },
        { href: "/ups-patcher", title: "UPS Patcher", description: "Checksum-verified patching, also seen on Game Boy." },
        { href: "/nes-rom-patcher", title: "NES ROM Patcher", description: "Another small-ROM, header-sensitive platform." },
      ]}
      emulatorCta={{ placement: "gbc_page" }}
      footer={
        <>
          Not sure which format your patch is? See{" "}
          <InlineLink href="/patch-formats">how IPS, UPS, and BPS compare</InlineLink>.
        </>
      }
    />
  );
}
