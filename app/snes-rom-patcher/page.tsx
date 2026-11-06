import type { Metadata } from "next";
import ToolPage from "@/components/tool/ToolPage";
import InlineLink from "@/components/ui/InlineLink";
import { IconFileQuestion } from "@/components/ui/icons";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "SNES ROM Patcher — Patch SNES ROMs Online",
  description:
    "Apply IPS, UPS, or BPS patches to an SNES ROM in your browser, with copier-header-aware matching for UPS and BPS patches.",
  path: "/snes-rom-patcher",
});

export default function SnesRomPatcherPage() {
  return (
    <ToolPage
      path="/snes-rom-patcher"
      breadcrumbLabel="SNES ROM Patcher"
      accent="amber"
      title="SNES ROM Patcher"
      intro={
        <p>
          Apply an IPS, UPS or BPS patch to an SNES ROM right on this page. The one thing to watch for is
          the old 512-byte copier header: UPS and BPS patches are matched against it for you, and IPS is
          applied to your file as it is.
        </p>
      }
      chips={["IPS", "UPS", "BPS"]}
      platform="snes"
      kicker="Super Nintendo · .sfc .smc"
      facts={[
        { label: "File types", value: ".sfc · .smc", note: "extension does not show the header" },
        { label: "Copier header", value: "512 bytes", note: "recognised on .sfc .smc .swc .fig" },
        { label: "BPS and UPS", value: "matched by checksum", note: "with or without the header" },
        { label: "IPS", value: "your file as is", note: "needs the header state its readme names" },
      ]}
      diagram={{
        title: "Headered or headerless: who decides",
        caption: "For BPS and UPS the patch's checksum decides whether your file is used whole or without its 512 bytes, and the header is put back afterwards. IPS has no checksum, so it is applied to exactly the file you give it.",
        rows: [
          { label: "Headered file", segments: [{ label: "Copier header", sub: "512 bytes", tone: "accent" }, { label: "ROM data", grow: 5 }] },
          { label: "Headerless file", segments: [{ label: "ROM data", grow: 5 }] },
          { label: "BPS / UPS: the checksum decides", segments: [{ label: "Matches the whole file", sub: "patch as is", tone: "ok" }, { label: "Matches without the header", sub: "set aside, patch, restore", tone: "ok" }] },
          { label: "IPS: no checksum", segments: [{ label: "Applied to your file exactly", sub: "wrong header state = silently wrong result", tone: "bad" }] },
        ],
      }}
      patcher={{
        heading: "Patch an SNES ROM",
        romLabel: "Original SNES ROM",
        romHint: "Your own .sfc or .smc dump",
        patchHint: "Usually .ips, .ups or .bps",
      }}
      verify={
        <>
          <p>
            Whether your file has a copier header is the first thing to know. The{" "}
            <InlineLink href="/rom-checksum-checker">ROM Checksum Checker</InlineLink>{" "}reports whether a
            512-byte header is present and whether the ROM is LoROM or HiROM, and shows its CRC32, MD5, SHA-1
            and SHA-256 to compare with the hack&apos;s page.
          </p>
          <p>
            For a UPS or BPS patch, the{" "}
            <InlineLink href="/patch-compatibility-checker">Patch Compatibility Checker</InlineLink>{" "}tells you
            whether it matches your file as is or only without its header. IPS carries no checksum, so for
            IPS the patch&apos;s readme is the authority on headered versus headerless.
          </p>
        </>
      }
      feature={{
        icon: <IconFileQuestion />,
        title: "The Copier Header, Explained",
        accent: "purple",
        body: (
          <>
            <p>
              Old SNES copiers added 512 extra bytes to the front of a dump. Some ROM files still carry them
              and some do not, and the .smc or .sfc extension does not tell you which. A patch built for one
              state will not line up with the other, which is the most common reason a correct SNES patch
              still fails.
            </p>
            <p>
              For UPS and BPS the patcher uses the patch&apos;s checksum to decide. If it matches your whole
              file, the patch is applied as is. If it matches only the file without its 512 bytes, the header
              is set aside, the patch applied, and the header put back, so your output keeps its header.
              Headers are recognised on .sfc, .smc, .swc and .fig files.
            </p>
            <p>
              <strong className="text-foreground">IPS patches need the right header state.</strong> IPS has
              no checksum to decide with, so the patcher applies it to exactly the file you give it and
              never adds or removes a header. A patch made for a headered ROM needs your headered file
              (512 extra bytes); a patch made for a headerless ROM needs a headerless one. The hack&apos;s
              readme says which; if it does not match your file, the result is silently wrong.
            </p>
          </>
        ),
      }}
      howTo={{
        name: "How to Patch an SNES ROM",
        description: "Steps to apply an IPS, UPS, or BPS patch to an SNES ROM using a browser-based patcher.",
        steps: [
          {
            title: "Start with your .sfc or .smc ROM",
            body: "Both extensions are common for SNES dumps. Neither tells you whether a copier header is present.",
          },
          {
            title: "Get the patch that matches your copy",
            body: "SNES hacks come as IPS, UPS or BPS depending on the project's age. Read the notes for the header state and revision.",
          },
          {
            title: "Select both files",
            body: "For UPS and BPS the header question is settled by the patch's checksum. For IPS your file is used as is.",
          },
          {
            title: "Download the patched ROM",
            body: "It has the same header state as the file you gave it and loads in any SNES emulator.",
          },
        ],
      }}
      mistakesTitle="Mistakes That Trip Up SNES Patching"
      mistakes={[
        {
          problem: "Not knowing whether the ROM has a copier header",
          solution:
            "Check it with the ROM Checksum Checker before patching. A file that is 512 bytes over a round size usually carries one.",
        },
        {
          problem: "Using an IPS patch with the opposite header state",
          solution:
            "A patch made for a headered ROM expects those 512 bytes and one made for a headerless dump does not. IPS cannot tell, so the result is quietly wrong when this is backwards.",
        },
        {
          problem: "Assuming IPS will catch a wrong-ROM mistake",
          solution:
            "Plenty of SNES hacks still use IPS, which has no verification built in. Newer BPS projects will catch this for you; IPS-based ones will not.",
        },
      ]}
      troubleshooting={[
        {
          problem: "A UPS or BPS patch is rejected",
          solution:
            "The message names the CRC32 the patch needs. If your file only differs by a copier header, the patcher already handles that, so the cause is usually a different region or revision.",
        },
        {
          problem: "IPS patch applies but the game is broken",
          solution:
            "Since IPS cannot verify the source ROM, this usually means the wrong revision or region, or the wrong header state. Compare the CRC32 and read the readme.",
        },
        {
          problem: "Output file size looks different from what I expected",
          solution:
            "The copier header, if your file had one, is kept in the output, so the size matches your input unless the patch itself changes the ROM size.",
        },
      ]}
      faq={[
        {
          question: "What is a SNES copier header?",
          answer:
            "A 512-byte block some old dumps carry at the start, left over from copier hardware. It is not part of the game itself.",
        },
        {
          question: "Does this patcher handle the copier header for me?",
          answer:
            "For UPS and BPS, yes: it recognises the header on .sfc, .smc, .swc and .fig files and uses the patch's checksum to apply the patch correctly either way. IPS is applied to the file exactly as supplied.",
        },
        {
          question: "Which patch format is most common for SNES hacks?",
          answer:
            "IPS historically, with UPS and BPS common for translations and newer or larger projects.",
        },
        {
          question: "Why do some SNES ROMs end in .smc and others in .sfc?",
          answer:
            "Both are common extensions for the same ROM data. The extension alone does not say whether a copier header is present.",
        },
      ]}
      related={[
        { href: "/", title: "ROM Patcher", description: "The general-purpose patcher for any console." },
        { href: "/ips-patcher", title: "IPS Patcher", description: "How IPS works and what it cannot check." },
        { href: "/bps-patcher", title: "BPS Patcher", description: "Checksum-verified patching for newer projects." },
        { href: "/nes-rom-patcher", title: "NES ROM Patcher", description: "The same header question for NES dumps." },
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
