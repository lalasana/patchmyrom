import type { PatchAnalysis, RomAnalysis } from "@/hooks/useFileAnalysis";
import { classifyCompatibility, type CompatVerdict } from "@/lib/patch-compat";

export type CompatibilityCheck = CompatVerdict;

/**
 * Proactive compatibility check between an analyzed ROM and patch. Classifies the pair as
 * the right original, the already-patched result, the wrong file, or unverifiable, with a
 * single explanation for each. A `blocking` verdict also disables the Apply button, but this
 * is only the early, friendly signal: the patch worker re-runs the identical classifier and
 * RomPatcher.js's own requireValidation check remains the authoritative gate at apply time.
 * Returns null until both analyses are available.
 */
export function checkCompatibility(
  rom: RomAnalysis | null,
  patch: PatchAnalysis | null
): CompatibilityCheck | null {
  if (!rom || !patch || !patch.recognized) return null;

  return classifyCompatibility({
    rom: { size: rom.fileSize, crc32: rom.crc32, headerless: rom.headerless },
    patch: {
      sourceSize: patch.sourceSize,
      targetSize: patch.targetSize,
      sourceCrc32: patch.sourceChecksumCRC32,
      targetCrc32: patch.targetChecksumCRC32,
    },
  });
}
