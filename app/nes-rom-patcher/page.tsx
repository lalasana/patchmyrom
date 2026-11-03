import type { Metadata } from "next";
import ToolPage from "@/components/tool/ToolPage";
import InlineLink from "@/components/ui/InlineLink";
import { IconInfo } from "@/components/ui/icons";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "NES ROM Patcher — Patch NES ROMs Online",
  description:
    "Apply IPS, UPS or BPS patches to an NES ROM directly in your browser, applied to your file exactly as it is, iNES header included.",
  path: "/nes-rom-patcher",
});

export default function NesRomPatcherPage() {
  return (
    <ToolPage
      path="/nes-rom-patcher"
      breadcrumbLabel="NES ROM Patcher"
      art="cartridge"
      accent="amber"
      title="NES ROM Patcher"
      intro={
        <p>
          Apply an IPS, UPS or BPS patch to an NES ROM right on this page. IPS is by far the most common
          format for NES hacks, and it is applied to your file exactly as you provide it, iNES header and
          all.
        </p>
      }
      chips={["IPS", "UPS", "BPS"]}
      patcher={{
        heading: "Patch an NES ROM",
        defaultFormat: "IPS",
        romLabel: "Original NES ROM",
        romHint: "Your own .nes dump",
        patchHint: "Usually .ips; .ups and .bps also work",
      }}
      verify={
        <>
          <p>
            An IPS patch cannot tell whether you gave it the right file, so check before patching. The{" "}
            <InlineLink href="/rom-checksum-checker">ROM Checksum Checker</InlineLink>{" "}reads the iNES header,
            reports it, and shows the CRC32, MD5, SHA-1 and SHA-256 to compare with the hack&apos;s readme.
          </p>
          <p>
            Readmes often say whether the patch expects a headered or a headerless ROM. If a UPS or BPS patch
            is involved, the{" "}
            <InlineLink href="/patch-compatibility-checker">Patch Compatibility Checker</InlineLink>{" "}can test
            the match first, and the patcher above does the same before it applies anything.
          </p>
        </>
      }
      feature={{
        icon: <IconInfo />,
        title: "The iNES Header and Your Patch",
        accent: "green",
        body: (
          <>
            <p>
              Most .nes files begin with a 16-byte iNES header: the letters NES and a 1A byte, then the
              program and graphics sizes, the mapper number and other flags. The emulator reads it; the
              console&apos;s game data starts right after.
            </p>
            <p>
              IPS counts offsets from the first byte of the file, so a patch made against a headered ROM
              needs a headered ROM, and one made against a headerless ROM needs a headerless one. PatchMyROM
              applies IPS to exactly the file you give it and never strips the header behind your back; use
              the version the patch&apos;s readme describes.
            </p>
            <p>
              UPS and BPS can be checked. If the patch&apos;s checksum matches your whole file, it is applied
              as is. If it matches only the file without its header, the header is set aside, the patch
              applied, and the header put back.
            </p>
            <p>
              NES ROMs are small, so IPS&apos;s 16 MB limit never comes up on this platform.
            </p>
          </>
        ),
      }}
      howTo={{
        name: "How to Patch an NES ROM",
        description: "Steps to apply an IPS patch to an NES ROM using a browser-based patcher.",
        steps: [
          {
            title: "Get an unmodified .nes ROM",
            body: "A clean dump of the cartridge that is not already patched or edited. Note whether it has an iNES header.",
          },
          {
            title: "Download the patch and read its notes",
            body: "NES hacks are usually .ips files. The notes say which game revision and header state they expect.",
          },
          {
            title: "Drop both files in",
            body: "The format is detected from the patch file itself, so you do not need to choose it.",
          },
          {
            title: "Download and play",
            body: "The file keeps the header your ROM had and loads in any NES emulator.",
          },
        ],
      }}
      mistakesTitle="Mistakes That Trip Up NES Patching"
      mistakes={[
        {
          problem: "Using a ROM whose header state does not match the patch",
          solution:
            "IPS offsets include the 16-byte header if the author counted it. Giving a headerless file to a headered patch, or the reverse, shifts every change by 16 bytes.",
        },
        {
          problem: "Applying a patch built for a different release",
          solution:
            "Regional releases and revisions of the same game can differ in their data. Match the patch to the version its notes list.",
        },
        {
          problem: "Expecting the patcher to flag a wrong ROM",
          solution:
            "IPS has no built-in verification. If the base ROM is wrong, the patch still applies, just incorrectly. Compare the CRC32 first.",
        },
      ]}
      troubleshooting={[
        {
          problem: "Screen is garbled or the game resets constantly",
          solution:
            "A classic sign the base ROM did not match the patch. Because IPS cannot verify it, check the revision and the header state the hack expects.",
        },
        {
          problem: "Emulator does not recognise the patched file",
          solution:
            "Confirm the file still starts with NES and a 1A byte. If you meant to patch a headerless file, the result will have no header either.",
        },
        {
          problem: "Patch applies cleanly but graphics are missing",
          solution:
            "That points to a wrong or altered base ROM rather than a patching failure, since the patcher only writes the bytes in the patch. Re-check the dump and the header.",
        },
      ]}
      faq={[
        {
          question: "Why is IPS so tied to NES specifically?",
          answer:
            "IPS is simple and tiny, and its 16 MB limit is no problem at NES scale, so there is little pressure to move to another format. Many tools still output it by default.",
        },
        {
          question: "What is the iNES header?",
          answer:
            "A 16-byte block at the start of most NES ROM files that records the mapper and the memory layout. Emulators read it to know how to run the rest of the file.",
        },
        {
          question: "Does patch size matter for NES ROMs?",
          answer:
            "Rarely. NES ROMs are small by any modern patch format's standards, so size limits that matter on bigger platforms do not come up here.",
        },
        {
          question: "Does PatchMyROM remove the iNES header before patching?",
          answer:
            "Not for IPS, which is applied to your file as it is. For UPS and BPS it sets the header aside only when the patch's checksum shows the headerless file is the one it was built for.",
        },
        {
          question: "Can I patch an NES ROM without deleting my emulator save?",
          answer:
            "No. Patching creates a new file and leaves your original ROM and your emulator's saves untouched.",
        },
      ]}
      related={[
        { href: "/", title: "ROM Patcher", description: "The general-purpose patcher for any console." },
        { href: "/ips-patcher", title: "IPS Patcher", description: "How IPS works and what it cannot check." },
        { href: "/snes-rom-patcher", title: "SNES ROM Patcher", description: "The same header question, with a copier header." },
        { href: "/troubleshooting", title: "Troubleshooting", description: "Fixes for the most common patching errors." },
        { href: "/rom-checksum-checker", title: "ROM Checksum Checker", description: "Read the iNES header and hash your ROM." },
        { href: "/patch-compatibility-checker", title: "Patch Compatibility Checker", description: "Test a ROM against a UPS or BPS patch first." },
      ]}
      footer={
        <>
          Want the details of the format NES hacks use? See the <InlineLink href="/ips-patcher">IPS Patcher guide</InlineLink>.
        </>
      }
    />
  );
}
