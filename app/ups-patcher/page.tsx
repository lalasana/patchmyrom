import type { Metadata } from "next";
import ToolPage from "@/components/tool/ToolPage";
import InlineLink from "@/components/ui/InlineLink";
import { IconGamepad } from "@/components/ui/icons";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "UPS Patcher — Apply .ups ROM Patches in Your Browser",
  description:
    "Apply UPS patch files to a ROM in your browser. UPS stores a checksum of the source and of the result, so a wrong or already-patched ROM is caught.",
  path: "/ups-patcher",
});

export default function UpsPatcherPage() {
  return (
    <ToolPage
      path="/ups-patcher"
      breadcrumbLabel="UPS Patcher"
      art="ups"
      accent="blue"
      title="UPS Patcher"
      intro={
        <p>
          UPS won&apos;t apply unless your ROM matches exactly. That strictness is the point: it exists to
          stop a patch from landing on the wrong file. Drop your ROM and .ups file in below.
        </p>
      }
      chips={["UPS"]}
      kicker="Patch format · .ups"
      facts={[
        { label: "Verifies", value: "source and output", note: "CRC32 of both" },
        { label: "Also stores", value: "patch CRC32", note: "detects a damaged file" },
        { label: "Stores changes as", value: "XOR differences", note: "not raw replacement bytes" },
        { label: "Can resize a ROM", value: "yes", note: "both sizes are recorded" },
      ]}
      diagram={{
        title: "Inside a UPS file",
        caption: "A UPS file records the size and CRC32 of the ROM it needs and of the ROM it produces, plus a CRC32 of itself. PatchMyROM uses them to tell the right original, an already-patched ROM and the wrong file apart.",
        rows: [
          { label: "Structure", segments: [{ label: "UPS1", sub: "signature" }, { label: "Input size", tone: "accent" }, { label: "Output size", tone: "accent" }, { label: "XOR change blocks", grow: 3 }, { label: "Input CRC32", tone: "ok" }, { label: "Output CRC32", tone: "ok" }, { label: "Patch CRC32", tone: "muted" }] },
          { label: "What PatchMyROM does with them", segments: [{ label: "Input CRC32", sub: "matches your ROM: patch it", tone: "ok" }, { label: "Output CRC32", sub: "matches your ROM: already patched, stop", tone: "muted" }, { label: "Neither matches", sub: "wrong ROM: stop and name both CRC32s", tone: "bad" }] },
        ],
      }}
      layout="format"
      patcher={{
        heading: "Apply a UPS patch",
        defaultFormat: "UPS",
        romLabel: "Original ROM file",
        romHint: "Any console: the exact file the patch was made for",
        patchHint: "Your .ups patch",
      }}
      verify={
        <>
          <p>
            A UPS patch carries the CRC32 of the ROM it needs, so you can test the match without patching.
            The <InlineLink href="/patch-compatibility-checker">Patch Compatibility Checker</InlineLink>{" "}reads
            it from the patch and compares it with your ROM. The patcher above runs the same comparison
            automatically.
          </p>
          <p>
            If the answer is a mismatch, hash your ROM with the{" "}
            <InlineLink href="/rom-checksum-checker">ROM Checksum Checker</InlineLink>{" "}and compare its CRC32,
            MD5, SHA-1 and SHA-256 with the hack&apos;s page to find which release you actually have.
          </p>
        </>
      }
      feature={{
        icon: <IconGamepad />,
        title: "Where You'll Run Into UPS",
        accent: "blue",
        body: (
          <>
            <p>
              UPS is common among translation projects and older SNES and GBA hacks, and it works the same on
              any console. For the headered cases, see the <InlineLink href="/snes-rom-patcher">SNES</InlineLink>{" "}
              page.
            </p>
            <p>
              A UPS file holds the size and CRC32 of the ROM it expects, the size and CRC32 of the ROM it
              produces, the CRC32 of the patch itself, and the changes stored as XOR differences. Sizes are
              included, so a UPS patch can grow a ROM.
            </p>
            <p>
              Because the checksums describe both ends, PatchMyROM can tell three cases apart: the right
              original, a ROM that is already the patched result, and the wrong file. It explains the last two
              and stops, rather than producing a damaged ROM. After applying, it compares the result with the
              stored output checksum and refuses to offer a file that fails.
            </p>
          </>
        ),
      }}
      howTo={{
        name: "How to Apply a UPS Patch",
        description: "Steps to apply a UPS patch file to a ROM using a browser-based patcher.",
        steps: [
          {
            title: "Confirm the exact ROM the patch wants",
            body: "Hack pages usually name the region and revision. UPS refuses a ROM that does not match.",
          },
          {
            title: "Download the .ups patch",
            body: "It is typically listed next to the project's release notes.",
          },
          {
            title: "Select the ROM and the patch",
            body: "The UPS signature is read automatically, so no format choice is needed.",
          },
          {
            title: "Download your patched ROM",
            body: "The result has been compared with the patch's stored output checksum before it is offered.",
          },
        ],
      }}
      mistakesTitle="Mistakes That Trip Up UPS Patching"
      mistakes={[
        {
          problem: "Assuming any copy of the game will work",
          solution:
            "UPS patches are tied to one dump. A different revision, region or a re-dump with different padding fails the checksum check.",
        },
        {
          problem: "Re-patching an already-patched ROM",
          solution:
            "When updating to a newer patch, start again from the clean backup. The patcher recognises an already-patched file and tells you, but it will not combine versions.",
        },
        {
          problem: "Losing track of which ROM revision you have",
          solution:
            "Keep the original download's name until you know it is the right one, and note its CRC32 from the checker.",
        },
      ]}
      troubleshooting={[
        {
          problem: "Patch is rejected instantly",
          solution:
            "The ROM's checksum did not match the one stored in the patch. The message gives the CRC32 the patch needs; compare it with yours.",
        },
        {
          problem: "Output size is different from what I expected",
          solution:
            "Some UPS patches deliberately enlarge a ROM. If the patch's output size differs from the source size, that is by design.",
        },
        {
          problem: "Patch works but text or graphics look broken",
          solution:
            "The file matched the patch's stored output checksum, so it is what the author made. Check the project's own known-issues notes.",
        },
      ]}
      faq={[
        {
          question: "How is UPS different from BPS?",
          answer:
            "Both check the source and result. UPS stores XOR differences and came first; BPS describes the changes with a more compact set of actions and is common for newer projects.",
        },
        {
          question: "Why does UPS reject my ROM without explanation?",
          answer:
            "It compares the exact CRC32 of the ROM it expects before touching anything. PatchMyROM adds the explanation: it shows the checksum the patch needs and the one your file has.",
        },
        {
          question: "Is UPS only used for translations?",
          answer:
            "It is especially common there, but it is a general format, and gameplay hacks use it too.",
        },
        {
          question: "Can a UPS patch make my ROM bigger?",
          answer:
            "Yes, if its author built it that way. The patch records both the input size and the output size.",
        },
      ]}
      related={[
        { href: "/", title: "ROM Patcher", description: "The general-purpose patcher for any console." },
        { href: "/patch-formats", title: "Patch Formats Compared", description: "IPS, UPS, BPS and xdelta side by side." },
        { href: "/bps-patcher", title: "BPS Patcher", description: "The newer checksum-verified format." },
        { href: "/troubleshooting", title: "Troubleshooting", description: "Fixes for checksum mismatches and wrong ROMs." },
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
