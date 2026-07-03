import type { PatchAnalysis, RomAnalysis } from "@/hooks/useFileAnalysis";
import { formatBytes } from "@/lib/format-bytes";

export type CompatibilityLevel = "ok" | "warning" | "unknown";

export type CompatibilityCheck = {
  level: CompatibilityLevel;
  message: string;
};

/**
 * Proactive, advisory-only compatibility check between an analyzed ROM and
 * patch. This never blocks patching — RomPatcher.js's own requireValidation
 * check remains the authoritative gate at apply time. Returns null until
 * both analyses are available.
 */
export function checkCompatibility(
  rom: RomAnalysis | null,
  patch: PatchAnalysis | null
): CompatibilityCheck | null {
  if (!rom || !patch || !patch.recognized) return null;

  if (!patch.canValidateSource || !patch.sourceChecksumCRC32) {
    return {
      level: "unknown",
      message:
        "This patch format doesn't embed a checksum, so compatibility can't be verified in advance. Double-check you have the right base ROM before applying.",
    };
  }

  if (patch.sourceSize !== null && rom.fileSize !== patch.sourceSize) {
    return {
      level: "warning",
      message: `Size mismatch: this patch expects a ${formatBytes(patch.sourceSize)} ROM, but your file is ${formatBytes(rom.fileSize)}. This is usually the wrong base ROM, though it can also mean your file has an extra header.`,
    };
  }

  if (rom.crc32.toLowerCase() !== patch.sourceChecksumCRC32.toLowerCase()) {
    return {
      level: "warning",
      message:
        "This ROM's checksum doesn't match what the patch expects — you may have the wrong region, revision, or a ROM with an extra header. Applying may still work if it's just a header difference.",
    };
  }

  return {
    level: "ok",
    message: "This ROM matches the patch's expected checksum.",
  };
}
