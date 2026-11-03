import type { Metadata } from "next";
import ToolPage from "@/components/tool/ToolPage";
import InlineLink from "@/components/ui/InlineLink";
import { IconShieldCheck } from "@/components/ui/icons";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "BPS Patcher — Apply .bps ROM Patches in Your Browser",
  description:
    "Apply BPS patch files to a ROM locally, with automatic checksum verification so you know immediately if the base ROM is wrong.",
  path: "/bps-patcher",
});

export default function BpsPatcherPage() {
  return (
    <ToolPage
      path="/bps-patcher"
      breadcrumbLabel="BPS Patcher"
      art="bps"
      accent="purple"
      title="BPS Patcher"
      intro={
        <p>
          BPS patches carry their own checksums, so a bad match is caught before it corrupts anything.
          Drop your ROM and .bps file in below; it applies entirely on your device.
        </p>
      }
      chips={["BPS"]}
      patcher={{
        heading: "Apply a BPS patch",
        defaultFormat: "BPS",
        romLabel: "Original ROM file",
        romHint: "Any console: the exact file the patch was made for",
        patchHint: "Your .bps patch",
      }}
      verify={
        <>
          <p>
            A BPS patch stores the CRC32 of the ROM it was made for. To see whether your file matches
            without patching, use the{" "}
            <InlineLink href="/patch-compatibility-checker">Patch Compatibility Checker</InlineLink>; the
            patcher above makes the same comparison before it applies anything, and says whether the ROM is
            the wrong one or is already patched.
          </p>
          <p>
            If you need to know which release your dump is, the{" "}
            <InlineLink href="/rom-checksum-checker">ROM Checksum Checker</InlineLink>{" "}shows its CRC32, MD5,
            SHA-1 and SHA-256 to compare with the hack&apos;s page.
          </p>
        </>
      }
      feature={{
        icon: <IconShieldCheck />,
        title: "Why Hack Creators Reach for BPS",
        accent: "purple",
        body: (
          <>
            <p>
              IPS never checked which file it was touching. A BPS patch records the size and CRC32 of the
              source ROM and of the finished result, plus a checksum of the patch itself, so it can fail
              loudly when something does not line up. That is why actively maintained hacks that publish
              frequent updates favor it.
            </p>
            <p>
              BPS also has no practical size ceiling, unlike IPS&apos;s 16 MB, and a patch can grow the ROM.
              PatchMyROM compares the finished file with the stored checksum and refuses to offer one that
              fails.
            </p>
            <p>
              Damaged or hostile BPS files are handled too. A patch that declares a size of 2 GiB or more, an
              impossible action length or an out-of-range offset is rejected within a fraction of a second
              with a clear message, instead of freezing the page, and you can drop in another file straight
              away.
            </p>
          </>
        ),
      }}
      howTo={{
        name: "How to Apply a BPS Patch",
        description: "Steps to apply a BPS patch file to a ROM using a browser-based patcher.",
        steps: [
          {
            title: "Line up your base ROM",
            body: "Check the hack's page for the exact game and revision. BPS rejects a mismatch rather than risk a broken result.",
          },
          {
            title: "Grab the .bps file",
            body: "It is usually distributed as a single file next to the hack's release notes.",
          },
          {
            title: "Select both in the patcher",
            body: "The format is read from the patch's own signature, so you do not tell it what it is looking at.",
          },
          {
            title: "Apply and download",
            body: "BPS verifies the output against its recorded checksum before the file is offered, so a download that appears has passed.",
          },
        ],
      }}
      mistakesTitle="Mistakes That Trip Up BPS Patching"
      mistakes={[
        {
          problem: "Ignoring the checksum-mismatch error",
          solution:
            "BPS rejects the wrong ROM on purpose, and it is not a bug in the patcher. Track down the exact base ROM version the hack lists, not just the same game.",
        },
        {
          problem: "Putting the files in the wrong boxes",
          solution:
            "The drop zones accept any file, so check that your original game went in the ROM box and the .bps in the patch box.",
        },
        {
          problem: "Expecting a BPS patch to work on a related but different game",
          solution:
            "BPS patches are built against one source file. A patch for one revision will not apply to another regional release.",
        },
      ]}
      troubleshooting={[
        {
          problem: "\"This isn't the original ROM this patch needs\" message",
          solution:
            "That is the check doing its job. The message names the CRC32 the patch needs and the one your file has. Re-check region, revision and that the file is not already modified.",
        },
        {
          problem: "Patch applies but the game will not boot",
          solution:
            "Rare with BPS, since both ends are checked. Confirm the output extension is the one your emulator expects for that platform, and check the hack's known issues.",
        },
        {
          problem: "The patch file itself will not load",
          solution:
            "Download it again; a truncated or edited file is the most common cause. Damaged BPS files are refused quickly with an explanation rather than hanging the page.",
        },
      ]}
      faq={[
        {
          question: "What makes BPS different from IPS?",
          answer:
            "BPS stores a checksum of both the ROM it expects and the ROM it produces. IPS stores neither, so BPS can catch a wrong-ROM mistake before any damage is done.",
        },
        {
          question: "Does BPS support bigger ROMs than IPS?",
          answer:
            "Yes. IPS is capped at about 16 MB by its offset size, while BPS has no comparable limit, which suits larger, newer hacks.",
        },
        {
          question: "Why did my BPS patch get rejected immediately?",
          answer:
            "The checksum in the patch did not match your ROM, which almost always means a different region or revision, or a ROM that has already been altered. A damaged patch file is reported separately.",
        },
        {
          question: "Can I trust that a completed BPS patch is correct?",
          answer:
            "It has been compared with the output checksum stored in the patch, so it matches what the author produced. That is about as strong a guarantee as a patch format offers.",
        },
      ]}
      related={[
        { href: "/", title: "ROM Patcher", description: "The general-purpose patcher for any console." },
        { href: "/patch-formats", title: "Patch Formats Compared", description: "IPS, UPS, BPS and xdelta side by side." },
        { href: "/ips-patcher", title: "IPS Patcher", description: "The older format BPS was designed to improve on." },
        { href: "/troubleshooting", title: "Troubleshooting", description: "Fixes for checksum mismatches and wrong ROMs." },
        { href: "/rom-checksum-checker", title: "ROM Checksum Checker", description: "Find which release your ROM is." },
        { href: "/patch-compatibility-checker", title: "Patch Compatibility Checker", description: "Test a ROM against a BPS patch first." },
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
