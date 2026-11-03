import type { Metadata } from "next";
import ToolPage from "@/components/tool/ToolPage";
import InlineLink from "@/components/ui/InlineLink";
import { IconBolt } from "@/components/ui/icons";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "NDS ROM Patcher — Patch Nintendo DS ROMs Online",
  description:
    "Apply xdelta patches to Nintendo DS ROMs directly in your browser, with real progress on large files. Nothing is uploaded.",
  path: "/nds-rom-patcher",
});

export default function NdsRomPatcherPage() {
  return (
    <ToolPage
      path="/nds-rom-patcher"
      breadcrumbLabel="NDS ROM Patcher"
      art="cartridge"
      accent="blue"
      title="NDS ROM Patcher"
      intro={
        <p>
          Patch a Nintendo DS ROM with an xdelta file, or an IPS, UPS or BPS one, right on this page.
          Large files show real progress while they are read, and nothing leaves your device.
        </p>
      }
      chips={["XDelta"]}
      patcher={{
        heading: "Patch an NDS ROM",
        romLabel: "Original NDS ROM",
        romHint: "Your own .nds dump",
        patchHint: "Most DS hacks use .xdelta; .ips, .ups and .bps also work",
      }}
      verify={
        <>
          <p>
            Two dumps of the same DS game can differ (trimmed versus full-size, for example), and an
            xdelta patch is built against one exact file. Check yours with the{" "}
            <InlineLink href="/rom-checksum-checker">ROM Checksum Checker</InlineLink>, which also reads the
            header to tell a DS ROM from a DSi one, and compare the CRC32 with the hack&apos;s notes.
          </p>
          <p>
            xdelta patches do not store a checksum of the ROM they expect, so the{" "}
            <InlineLink href="/patch-compatibility-checker">Patch Compatibility Checker</InlineLink>{" "}will say
            it cannot verify them. The patcher still checks the finished file whenever the patch carries
            output checksums, and refuses to hand over one that fails.
          </p>
        </>
      }
      feature={{
        icon: <IconBolt />,
        title: "Patching at DS Scale",
        accent: "purple",
        body: (
          <>
            <p>
              DS ROMs run from tens to hundreds of megabytes, many times the size of a typical GBA game, so
              reading and checking the file is the slowest part. The patcher reads it in chunks and reports
              progress instead of looking frozen.
            </p>
            <p>
              Everything happens in memory: the ROM, the patch and the patched copy are all held at once, so
              you need free memory of more than twice the ROM&apos;s size. If a device runs out, the patcher
              reports an out-of-memory error rather than crashing; a desktop browser is the safest choice for
              the biggest files.
            </p>
            <p>
              This is why DS hacks, including the DS entries in our{" "}
              <InlineLink href="/pokemon-rom-patcher">Pokémon hack reference</InlineLink>, are normally
              distributed as xdelta. The <InlineLink href="/xdelta-patcher">xdelta Patcher</InlineLink>{" "}page
              explains the format and which xdelta variants are supported.
            </p>
          </>
        ),
      }}
      howTo={{
        name: "How to Patch a Nintendo DS ROM",
        description: "Steps to apply an xdelta patch to a Nintendo DS ROM using a browser-based patcher.",
        steps: [
          {
            title: "Locate your .nds ROM",
            body: "Use the exact dump the patch author names. File size alone is not enough to tell dumps apart.",
          },
          {
            title: "Download the matching patch",
            body: "DS patches are usually a single .xdelta file built against one specific ROM.",
          },
          {
            title: "Load both into the patcher",
            body: "Expect a wait on big files; the progress bar shows reading, patching and verifying separately.",
          },
          {
            title: "Download the finished ROM",
            body: "The result keeps your file's name with “(patched)” added, ready for a DS emulator or flashcart tool.",
          },
        ],
      }}
      mistakesTitle="Mistakes That Trip Up NDS Patching"
      mistakes={[
        {
          problem: "Not budgeting time and memory for a large file",
          solution:
            "A 200 MB ROM takes noticeably longer to read than a 16 MB GBA file and needs more than twice its size in free memory. Close other heavy tabs first.",
        },
        {
          problem: "Using a dump from a different source than the patch expects",
          solution:
            "Dumps of the same game can differ slightly depending on how they were extracted. Match the exact source the patch author recommends.",
        },
        {
          problem: "Closing the tab mid-patch",
          solution:
            "The work lives in the page. Wait for the download button, especially on older phones and laptops where large files can take minutes.",
        },
      ]}
      troubleshooting={[
        {
          problem: "The page looks idle while a big ROM loads",
          solution:
            "Reading and checking a multi-hundred-megabyte file takes real time. Watch the progress bar; it advances as chunks are read.",
        },
        {
          problem: "Patch fails right away",
          solution:
            "For xdelta this usually means the ROM is not the exact dump the patch targets. If the message names DJW or FGK compression, the patch needs re-creating or the official xdelta3 tool, as explained on the xdelta page.",
        },
        {
          problem: "Patch applies but the game will not load on a flashcart",
          solution:
            "That is usually a flashcart firmware or file-naming matter rather than a patching one. Check the flashcart's documentation, and test the patched file in an emulator first.",
        },
      ]}
      faq={[
        {
          question: "Why are Nintendo DS ROMs so much bigger than GBA ones?",
          answer:
            "DS games store far more data (two screens, 3D graphics, larger worlds), and the cartridges are larger. That size is why DS hacks lean on xdelta.",
        },
        {
          question: "Can a browser really patch a 300MB+ ROM?",
          answer:
            "Yes, provided the device has enough free memory, because the ROM, patch and result are held at once. It takes longer than a small file, and a clear error appears if memory runs out.",
        },
        {
          question: "What patch format do NDS ROM hacks use?",
          answer:
            "Most use xdelta, as the Pokémon DS hacks in our reference do. Some use IPS, UPS or BPS, and those work here too; the format is read from the file.",
        },
        {
          question: "Do I need a specific emulator for a patched DS ROM?",
          answer:
            "Any emulator or flashcart that runs the original game should run the patched one, since patching changes the ROM's contents, not its format.",
        },
      ]}
      related={[
        { href: "/", title: "ROM Patcher", description: "The general-purpose patcher for any console." },
        { href: "/xdelta-patcher", title: "xdelta Patcher", description: "How xdelta works and which variants are supported." },
        { href: "/troubleshooting", title: "Troubleshooting", description: "Fixes for checksum mismatches and failed patches." },
        { href: "/gba-rom-patcher", title: "GBA ROM Patcher", description: "For Game Boy Advance hacks instead." },
        { href: "/rom-checksum-checker", title: "ROM Checksum Checker", description: "Hash a large ROM and compare it with the hack's notes." },
        { href: "/patch-compatibility-checker", title: "Patch Compatibility Checker", description: "See what can and cannot be verified for your patch." },
      ]}
      footer={
        <>
          Working with a particular patch type? Read the{" "}
          <InlineLink href="/xdelta-patcher">xdelta Patcher guide</InlineLink>.
        </>
      }
    />
  );
}
