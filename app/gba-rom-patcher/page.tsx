import type { Metadata } from "next";
import ToolPage from "@/components/tool/ToolPage";
import InlineLink from "@/components/ui/InlineLink";
import { IconCartridge } from "@/components/ui/icons";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "GBA ROM Patcher — Patch Game Boy Advance ROMs Online",
  description:
    "Apply IPS, UPS, or BPS patches to a Game Boy Advance ROM directly in your browser. No installs, nothing uploaded.",
  path: "/gba-rom-patcher",
});

export default function GbaRomPatcherPage() {
  return (
    <ToolPage
      path="/gba-rom-patcher"
      breadcrumbLabel="GBA ROM Patcher"
      art="cartridge"
      accent="purple"
      title="GBA ROM Patcher"
      intro={
        <p>
          Patch a Game Boy Advance ROM with an IPS, UPS or BPS file, right on this page. The files are
          read and patched in your browser, so nothing is uploaded.
        </p>
      }
      chips={["IPS", "UPS", "BPS"]}
      patcher={{
        heading: "Patch a GBA ROM",
        romLabel: "Original GBA ROM",
        romHint: "Your own .gba dump",
        patchHint: "Usually .ips, .ups or .bps",
      }}
      verify={
        <>
          <p>
            Most GBA hacks name the exact game, region and revision they were built for. Drop your .gba
            file into the <InlineLink href="/rom-checksum-checker">ROM Checksum Checker</InlineLink>{" "}to see
            its CRC32, MD5, SHA-1 and SHA-256 and to confirm from the cartridge header that it really is a
            GBA ROM, then compare those values with the hack&apos;s page.
          </p>
          <p>
            For a UPS or BPS patch you can also test the match before patching with the{" "}
            <InlineLink href="/patch-compatibility-checker">Patch Compatibility Checker</InlineLink>. The
            patcher above runs the same check automatically and stops with a plain explanation if the ROM
            is the wrong one or is already patched.
          </p>
        </>
      }
      feature={{
        icon: <IconCartridge />,
        title: "What Is Specific to GBA",
        accent: "green",
        body: (
          <>
            <p>
              A GBA cartridge can hold up to 32 MB of ROM, but an IPS patch cannot write past 16 MB. Hacks
              that grow the game into the upper half of that space therefore ship as UPS or BPS, which is
              one reason you will see all three formats on GBA. The patcher reads the format from the
              patch file itself, so you never have to guess.
            </p>
            <p>
              GBA dumps do not use a copier header the way NES and SNES dumps can, so there is nothing to
              strip first. The patcher also leaves the GBA header alone: it writes exactly the bytes the
              patch contains, and for UPS and BPS it then checks the result against the checksum stored in
              the patch.
            </p>
            <p>
              The base ROM matters more than anything else. Pokémon hacks are the classic case, where a
              different revision of the same game is a different file; the{" "}
              <InlineLink href="/pokemon-rom-patcher">Pokémon ROM Patcher reference</InlineLink>{" "}lists
              the base game commonly reported for 50 popular hacks.
            </p>
          </>
        ),
      }}
      howTo={{
        name: "How to Patch a GBA ROM",
        description: "Steps to apply an IPS, UPS, or BPS patch to a Game Boy Advance ROM using a browser-based patcher.",
        steps: [
          {
            title: "Confirm the base ROM",
            body: "Read the hack's page for the required game, region and revision, and compare your file's CRC32 with the one it lists.",
          },
          {
            title: "Drop in the .gba file and the patch",
            body: "The format comes from the patch file's contents, not its extension, so a renamed file is still recognised.",
          },
          {
            title: "Read the verdict",
            body: "UPS and BPS stop with an explanation when the ROM is wrong or already patched. IPS has no checksum, so it cannot warn you.",
          },
          {
            title: "Download and load it",
            body: "The result is named after your ROM with “(patched)” added and keeps the .gba extension.",
          },
        ],
      }}
      mistakesTitle="Mistakes That Trip Up GBA Patching"
      mistakes={[
        {
          problem: "Not checking the ROM revision first",
          solution:
            "GBA games often had several regional releases and revisions with different data. A patch built for one can fail or misbehave on another; match the region and revision, not just the title.",
        },
        {
          problem: "Patching a ROM that is already modified",
          solution:
            "Cheats, a previous patch or a randomizer change the bytes the patch expects. A UPS or BPS patch will tell you the ROM is already patched; an IPS patch will not. Start from the clean dump.",
        },
        {
          problem: "Using an IPS patch for a hack that outgrew it",
          solution:
            "IPS cannot address beyond 16 MB. If a hack is distributed as UPS or BPS, use that file; converting or guessing rarely helps.",
        },
      ]}
      troubleshooting={[
        {
          problem: "Emulator shows a black or white screen after patching",
          solution:
            "Usually a base ROM mismatch, most often with an IPS patch that could not check it. Re-check the exact region and revision in the hack's documentation and compare the CRC32.",
        },
        {
          problem: "Patch is rejected before it even applies",
          solution:
            "For UPS and BPS this means the checksum stored in the patch does not match your file, a strong sign you have a different revision. The message names the CRC32 the patch needs.",
        },
        {
          problem: "Patched file plays but looks or sounds wrong",
          solution:
            "Once a UPS or BPS patch has passed its checks, the file is exactly what the author made. Odd behaviour then is a hack issue, so check the project's known-issues list.",
        },
      ]}
      faq={[
        {
          question: "Which patch formats do GBA ROM hacks use?",
          answer:
            "IPS, UPS and BPS all appear. Small or older hacks are often IPS; hacks that grow the ROM past 16 MB need UPS or BPS, and many newer projects use BPS for its built-in checksums.",
        },
        {
          question: "Do GBA ROMs need a header removed before patching?",
          answer:
            "No. GBA dumps do not carry a copier header, so the patcher applies the patch to the file as it is.",
        },
        {
          question: "Does the patcher fix the GBA header checksum?",
          answer:
            "No. It writes exactly what the patch contains. The only header checksums it ever adjusts are Game Boy and Mega Drive ones, and only for patches that do not define the output exactly.",
        },
        {
          question: "Why are there so many GBA ROM hacks compared to other consoles?",
          answer:
            "No single cause is documented. Likely contributors: the system is well understood, its ROMs are small enough for hobbyist tools, and mature community tools and decompilation projects exist for popular games.",
        },
        {
          question: "Can I patch a GBA ROM on my phone?",
          answer:
            "Yes, patching happens in the browser, so it works in mobile browsers too. GBA ROMs are at most 32 MB, which is comfortable for current phones.",
        },
      ]}
      related={[
        { href: "/", title: "ROM Patcher", description: "The general-purpose patcher for any console." },
        { href: "/ips-patcher", title: "IPS Patcher", description: "The simplest format, and its 16 MB limit." },
        { href: "/bps-patcher", title: "BPS Patcher", description: "Checksum-verified patching, common for newer GBA hacks." },
        { href: "/pokemon-rom-patcher", title: "Pokemon ROM Patcher", description: "Base ROM reference for 50 popular Pokemon ROM hacks." },
        { href: "/rom-checksum-checker", title: "ROM Checksum Checker", description: "Compare your ROM's CRC32 with the hack's page." },
        { href: "/patch-compatibility-checker", title: "Patch Compatibility Checker", description: "Test a ROM against a patch before applying it." },
      ]}
      emulatorCta={{ placement: "gba_page" }}
      footer={
        <>
          Not sure which format your patch is? See{" "}
          <InlineLink href="/patch-formats">how IPS, UPS, and BPS compare</InlineLink>.
        </>
      }
    />
  );
}
