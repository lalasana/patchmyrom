import type { Metadata } from "next";
import ToolPage from "@/components/tool/ToolPage";
import InlineLink from "@/components/ui/InlineLink";
import { IconInfo } from "@/components/ui/icons";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "xdelta Patcher — Apply .xdelta ROM Patches in Your Browser",
  description:
    "Apply xdelta/VCDIFF patches to large ROM files directly in your browser, including Nintendo DS games. No installs, nothing uploaded.",
  path: "/xdelta-patcher",
});

export default function XdeltaPatcherPage() {
  return (
    <ToolPage
      path="/xdelta-patcher"
      breadcrumbLabel="xdelta Patcher"
      art="xdelta"
      accent="amber"
      title="xdelta Patcher"
      intro={
        <p>
          xdelta handles the ROMs other formats weren&apos;t built for, mainly large Nintendo DS games.
          Apply your .xdelta file below; it runs locally in your browser like everything else here.
        </p>
      }
      chips={["XDelta"]}
      kicker="Patch format · .xdelta"
      facts={[
        { label: "Based on", value: "VCDIFF", note: "RFC 3284 binary diff" },
        { label: "Checks your ROM", value: "not in advance", note: "output Adler-32 verified when present" },
        { label: "Secondary compression", value: "none · LZMA", note: "DJW and FGK are refused" },
        { label: "Best for", value: "large files", note: "DS-sized ROMs" },
      ]}
      diagram={{
        title: "Which xdelta files work",
        caption: "xdelta stores a list of copy, add and run instructions in windows. Patches may also compress those sections; PatchMyROM decodes none and LZMA, and tells you plainly when a patch uses DJW or FGK.",
        rows: [
          { label: "Secondary compression inside the patch", segments: [{ label: "None", sub: "supported", tone: "ok" }, { label: "LZMA", sub: "supported", tone: "ok" }, { label: "DJW", sub: "refused, named", tone: "bad" }, { label: "FGK", sub: "refused, named", tone: "bad" }] },
          { label: "How a patch is applied", segments: [{ label: "Source ROM", sub: "read only", grow: 2 }, { label: "Windows of copy, add and run", grow: 4, tone: "accent" }, { label: "Adler-32 per window", sub: "verifies output, if present", grow: 2, tone: "ok" }, { label: "Patched ROM", grow: 2 }] },
        ],
      }}
      layout="format"
      patcher={{
        heading: "Apply an xdelta patch",
        defaultFormat: "xdelta",
        romLabel: "Original ROM file",
        romHint: "Any console: the exact file the patch was made for",
        patchHint: "Your .xdelta or .vcdiff patch",
      }}
      verify={
        <>
          <p>
            xdelta diffs are extremely sensitive to the input file, but they do not record a checksum of the
            ROM they expect. The{" "}
            <InlineLink href="/patch-compatibility-checker">Patch Compatibility Checker</InlineLink>{" "}will
            therefore report xdelta as one it cannot verify, and say so instead of guessing.
          </p>
          <p>
            Your best check is the ROM itself: hash it with the{" "}
            <InlineLink href="/rom-checksum-checker">ROM Checksum Checker</InlineLink>{" "}and compare the CRC32
            with the hack&apos;s notes. After patching, any xdelta patch that carries Adler-32 checksums of its
            output is verified, and a result that fails is refused.
          </p>
        </>
      }
      feature={{
        icon: <IconInfo />,
        title: "A Tool Borrowed From Outside ROM Hacking",
        accent: "amber",
        body: (
          <>
            <p>
              Unlike IPS, UPS or BPS, xdelta was not built for ROMs. It is a general binary diff tool based
              on the VCDIFF format (RFC 3284), used well beyond gaming. ROM hackers adopted it because it
              copes with very large files, such as Nintendo DS games, without the diff becoming unreasonably
              large.
            </p>
            <p>
              <strong className="text-foreground">What is supported.</strong>{" "}Plain VCDIFF patches and ones
              with LZMA secondary compression, which xdelta3 uses by default in builds that include LZMA.
              Patches using DJW or FGK secondary compression are recognised but not applied: PatchMyROM
              names the method and tells you to ask the author for a patch made with{" "}
              <code className="text-foreground">xdelta3 -S none</code> or{" "}
              <code className="text-foreground">-S lzma</code>, or to use the official xdelta3 tool.
            </p>
            <p>
              Large files take time to read and need more than twice their size in free memory. See the{" "}
              <InlineLink href="/nds-rom-patcher">NDS ROM Patcher</InlineLink>{" "}page for what that means in
              practice.
            </p>
          </>
        ),
      }}
      howTo={{
        name: "How to Apply an xdelta Patch",
        description: "Steps to apply an xdelta (VCDIFF) patch file to a large ROM using a browser-based patcher.",
        steps: [
          {
            title: "Have your base ROM ready",
            body: "xdelta patches for a DS game can mean waiting on a file of tens or hundreds of megabytes. Make sure you have the exact dump.",
          },
          {
            title: "Get the .xdelta patch file",
            body: "It is usually a single file. Check that it is meant for your ROM revision.",
          },
          {
            title: "Load both files into the patcher",
            body: "Large files take a moment to read, and progress is shown while it works.",
          },
          {
            title: "Download the result",
            body: "The patched ROM is assembled locally and offered as a normal download once any available checksums pass.",
          },
        ],
      }}
      mistakesTitle="Mistakes That Trip Up xdelta Patching"
      mistakes={[
        {
          problem: "Expecting xdelta to be ROM-hacking-specific",
          solution:
            "It is a general binary diff tool. That means it carries no ROM conventions such as headers or a stored source checksum the way BPS and UPS do.",
        },
        {
          problem: "Using a differently dumped copy of a large ROM",
          solution:
            "Two dumps of the same game can differ by a few bytes, which is enough to break an xdelta patch. Use the exact source the patch author names.",
        },
        {
          problem: "Assuming every .xdelta file behaves the same way",
          solution:
            "Patches can use secondary compression, and the extension does not say which. PatchMyROM applies plain and LZMA-compressed patches, and names DJW or FGK ones as unsupported.",
        },
      ]}
      troubleshooting={[
        {
          problem: "Patch is rejected for its secondary compression",
          solution:
            "The message names DJW or FGK. Ask the hack's author for a patch built with `xdelta3 -S none` (or `-S lzma`), or apply it with the official xdelta3 command-line tool.",
        },
        {
          problem: "It is taking a long time with no visible progress",
          solution:
            "Reading and checking a file of hundreds of megabytes takes real time in a browser. The progress bar advances as it works, which is expected, not a sign it is stuck.",
        },
        {
          problem: "Patch applies but the game does not boot",
          solution:
            "Confirm your source ROM matches byte for byte what the patch was built from. When the patch carries output checksums, PatchMyROM refuses a result that fails them, so a file that downloaded has passed.",
        },
      ]}
      faq={[
        {
          question: "Is xdelta a ROM hacking format like IPS or BPS?",
          answer:
            "No. xdelta is a general-purpose binary diff tool. The ROM hacking community adopted it because it copes well with very large files.",
        },
        {
          question: "Why is xdelta used for Nintendo DS games specifically?",
          answer:
            "DS ROMs run from tens to hundreds of megabytes. IPS cannot address more than 16 MB, and other formats were designed around smaller games.",
        },
        {
          question: "Why did my xdelta patch fail when others worked fine?",
          answer:
            "The most common cause is a base ROM that does not match exactly. A less common one is a patch built with DJW or FGK secondary compression, which PatchMyROM cannot decode; uncompressed and LZMA patches are supported.",
        },
        {
          question: "Which xdelta variants does PatchMyROM support?",
          answer:
            "Uncompressed VCDIFF patches and LZMA-compressed ones. Patches with DJW or FGK secondary compression are detected and rejected with a message that says which one, because PatchMyROM cannot decode them.",
        },
        {
          question: "Does patching a huge ROM in a browser actually work?",
          answer:
            "Yes, though it takes longer than a small GBA or SNES file and needs enough free memory. If the device runs out, a clear out-of-memory message appears.",
        },
      ]}
      related={[
        { href: "/", title: "ROM Patcher", description: "The general-purpose patcher for any console." },
        { href: "/patch-formats", title: "Patch Formats Compared", description: "IPS, UPS, BPS and xdelta side by side." },
        { href: "/nds-rom-patcher", title: "NDS ROM Patcher", description: "Where xdelta is used most: large DS ROMs." },
        { href: "/troubleshooting", title: "Troubleshooting", description: "Fixes for common patching errors." },
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
