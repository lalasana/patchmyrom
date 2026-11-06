import type { Metadata } from "next";
import ToolPage from "@/components/tool/ToolPage";
import InlineLink from "@/components/ui/InlineLink";
import { IconInfo } from "@/components/ui/icons";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "IPS Patcher — Apply .ips ROM Patches in Your Browser",
  description:
    "Apply IPS patch files to a ROM directly in your browser. No installs, no command line — just the ROM, the .ips file, and a download.",
  path: "/ips-patcher",
});

export default function IpsPatcherPage() {
  return (
    <ToolPage
      path="/ips-patcher"
      breadcrumbLabel="IPS Patcher"
      art="ips"
      accent="green"
      title="IPS Patcher"
      intro={
        <p>
          IPS is the oldest patch format still in everyday use. If your file ends in{" "}
          <code className="text-foreground">.ips</code>, drop it in below with your ROM: it is applied
          locally, with no installer and no command line.
        </p>
      }
      chips={["IPS"]}
      kicker="Patch format · .ips"
      facts={[
        { label: "Checks your ROM", value: "never", note: "no field records the source" },
        { label: "Reach", value: "16 MB", note: "3-byte offsets" },
        { label: "File size", value: "tiny", note: "only the changed bytes" },
        { label: "Best check", value: "your ROM's CRC32", note: "compare it with the readme" },
      ]}
      diagram={{
        title: "Inside an IPS file",
        caption: "An IPS file is a header, a list of change records and an end marker. Nothing in it describes the ROM it was made for, which is why it is tiny and why no tool can warn you about the wrong file.",
        rows: [
          { label: "Structure", segments: [{ label: "PATCH", sub: "5-byte header" }, { label: "Offset", sub: "3 bytes", tone: "accent" }, { label: "Size", sub: "2 bytes", tone: "accent" }, { label: "Bytes to write", grow: 2, tone: "accent" }, { label: "More records", grow: 2 }, { label: "EOF", sub: "end marker" }] },
          { label: "Not stored anywhere in the file", segments: [{ label: "Source ROM size", tone: "bad" }, { label: "Source checksum", tone: "bad" }, { label: "Result checksum", tone: "bad" }] },
        ],
      }}
      layout="format"
      patcher={{
        heading: "Apply an IPS patch",
        defaultFormat: "IPS",
        romLabel: "Original ROM file",
        romHint: "Any console: the file the patch was made for",
        patchHint: "Your .ips patch",
      }}
      verify={
        <>
          <p>
            IPS stores no checksum, so neither this page nor any other IPS tool can tell you the ROM is
            wrong. That makes checking first worthwhile: hash your ROM with the{" "}
            <InlineLink href="/rom-checksum-checker">ROM Checksum Checker</InlineLink>{" "}and compare its CRC32
            with the one in the hack&apos;s readme.
          </p>
          <p>
            The <InlineLink href="/patch-compatibility-checker">Patch Compatibility Checker</InlineLink>{" "}will
            report IPS as one it cannot verify, and say so plainly, rather than guessing. UPS and BPS can be
            verified, which is the main reason newer hacks use them.
          </p>
        </>
      }
      feature={{
        icon: <IconInfo />,
        title: "Where IPS Still Shows Up",
        accent: "green",
        body: (
          <>
            <p>
              IPS is still the default output of many hacking tools, so you will meet it most on NES, SNES,
              Game Boy and smaller GBA projects. Bigger, actively updated hacks tend to move on once they need
              more space or want the patch to verify itself.
            </p>
            <p>
              An IPS file is a list of records: a 3-byte offset, a length and the bytes to write there (or a
              run of one repeated byte), ending with the letters EOF. It records nothing about the ROM it was
              made for. That is why IPS patches are tiny, and why they cannot warn you about the wrong file.
            </p>
            <p>
              Three-byte offsets cap what IPS can reach at 16 MB. Larger ROMs, such as most DS games, need
              another format, and several GBA hacks moved to UPS or BPS for the same reason.
            </p>
            <p>
              PatchMyROM applies IPS to exactly the file you provide, byte for byte, without stripping any
              header. If the patch was made for a headered ROM, give it a headered one; the{" "}
              <InlineLink href="/nes-rom-patcher">NES</InlineLink> and{" "}
              <InlineLink href="/snes-rom-patcher">SNES</InlineLink> pages explain both cases.
            </p>
          </>
        ),
      }}
      howTo={{
        name: "How to Apply an IPS Patch",
        description: "Steps to apply an IPS patch file to a ROM using a browser-based patcher.",
        steps: [
          {
            title: "Get a clean base ROM",
            body: "IPS patches are built against one exact file. A ROM that is already patched, trained or randomized will not work.",
          },
          {
            title: "Download the .ips file",
            body: "Take it from the hack's own page. IPS patches are small, from a few kilobytes to a couple of megabytes.",
          },
          {
            title: "Drop in the ROM and the patch",
            body: "The format is detected from the patch file's own signature, so nothing needs configuring.",
          },
          {
            title: "Download the patched ROM",
            body: "The output is generated locally and named after your original file, with “(patched)” added.",
          },
        ],
      }}
      mistakesTitle="Mistakes That Break IPS Patches"
      mistakes={[
        {
          problem: "Patching a ROM that is already modified",
          solution:
            "Cheats, previous patches or randomizer output change the bytes the patch expects. Start from an untouched backup every time.",
        },
        {
          problem: "Assuming a silent success means it worked",
          solution:
            "IPS has no way to verify it is touching the right file. If the output looks wrong, suspect the base ROM first.",
        },
        {
          problem: "Using a ROM larger than IPS can address",
          solution:
            "Offsets are 3 bytes wide, so IPS reaches 16 MB at most. For bigger games the hack will use xdelta, UPS or BPS instead.",
        },
      ]}
      troubleshooting={[
        {
          problem: "Graphics are garbled or the game will not boot",
          solution:
            "The classic sign of a wrong-ROM IPS patch. Because IPS cannot check, it writes bytes at the wrong offsets without complaint. Re-check the revision and the header state the patch expects.",
        },
        {
          problem: "The patched file is identical to the original",
          solution:
            "Either the ROM was already patched, so the patch wrote the same bytes, or the patch file has no changes for this file. Start again from a clean dump.",
        },
        {
          problem: "Everything is shifted or the game crashes right away",
          solution:
            "A headered patch on a headerless ROM, or the reverse, moves every change by the header size (16 bytes for NES, 512 for SNES). Use the header state the readme names.",
        },
      ]}
      faq={[
        {
          question: "What does IPS actually stand for?",
          answer: "International Patching System. It is one of the oldest ROM patch formats and has no formal specification beyond how existing tools write it.",
        },
        {
          question: "Is IPS still used for new ROM hacks?",
          answer:
            "Yes, especially for smaller projects and older platforms. Larger or actively updated hacks often move to BPS, which can verify the base ROM and has no 16 MB limit.",
        },
        {
          question: "Why doesn't the patcher warn me if I pick the wrong ROM?",
          answer:
            "IPS has no field that records which ROM it expects, so there is nothing to compare. Hash the ROM and check it against the hack's documentation instead.",
        },
        {
          question: "Can IPS patch large ROMs like NDS games?",
          answer:
            "No. Three-byte offsets stop at 16 MB, which rules out most DS games. Those use xdelta.",
        },
      ]}
      related={[
        { href: "/", title: "ROM Patcher", description: "The general-purpose patcher for any console." },
        { href: "/patch-formats", title: "Patch Formats Compared", description: "IPS, UPS, BPS and xdelta side by side." },
        { href: "/bps-patcher", title: "BPS Patcher", description: "The checksum-verified successor to IPS." },
        { href: "/troubleshooting", title: "Troubleshooting", description: "Fixes for the most common patching errors." },
      ]}
      footer={
        <>
          Not sure which format your patch is? See{" "}
          <InlineLink href="/patch-formats">how IPS, UPS, and BPS compare</InlineLink>.
        </>
      }
    />
  );
}
