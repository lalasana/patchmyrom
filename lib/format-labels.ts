import type { FormatKey } from "@/components/ui/FormatBadge";

/**
 * Maps the vendored RomPatcher.js's internal constructor names
 * (`patch.constructor.name`) to this site's themed FormatBadge/FormatChip
 * keys. Formats with no dedicated theme (BDF, PMSR) return null and should
 * fall back to a neutral, untinted badge.
 */
const DETECTED_FORMAT_TO_CHIP_KEY: Partial<Record<string, FormatKey>> = {
  IPS: "IPS",
  UPS: "UPS",
  BPS: "BPS",
  VCDIFF: "XDelta",
  APS: "APS",
  APSGBA: "APS",
  PPF: "PPF",
  RUP: "RUP",
};

export function mapDetectedFormatToChipKey(format: string | null): FormatKey | null {
  if (!format) return null;
  return DETECTED_FORMAT_TO_CHIP_KEY[format] ?? null;
}

/** Human-friendly display name for a detected format's raw constructor name. */
export function getFormatDisplayName(format: string | null): string {
  if (!format) return "Unknown";
  if (format === "VCDIFF") return "xdelta";
  if (format === "APSGBA") return "APS (GBA)";
  if (format === "APS") return "APS (N64)";
  return format;
}
