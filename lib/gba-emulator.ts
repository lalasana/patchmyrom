/**
 * GBA Emulator promotion — single source of truth.
 * Change the Play Store URL / names here and every CTA, page and structured-data block follows.
 *
 * Facts below are taken from the app's public Google Play listing (checked 2026-10-19):
 * title "GBA Emulator: Play Retro Games", developer Gamesira, GBA + GBC + GB support, free to
 * download with ads. It does NOT support Nintendo DS — never imply otherwise in copy.
 */
export const GBA_EMULATOR_URL = "https://play.google.com/store/apps/details?id=app.gbaemulator";
export const GBA_EMULATOR_NAME = "GBA Emulator";
export const GBA_EMULATOR_TITLE = "GBA Emulator: Play Retro Games";
export const GBA_EMULATOR_DEVELOPER = "Gamesira";
export const GBA_EMULATOR_PAGE = "/gba-emulator";
export const GBA_EMULATOR_SYSTEMS = ["GBA", "GBC", "GB"] as const;

export type GbaEmulatorPlacement =
  | "success"
  | "home"
  | "gba_page"
  | "gbc_page"
  | "pokemon_page"
  | "guide_page"
  | "emulator_page";

/** True for output files the emulator can play (.gba, .gbc, .gb). Never true for .nds, .sfc, .nes, … */
export function isGameBoyFamilyFile(fileName: string): boolean {
  return /\.(gba|gbc|gb)$/i.test(fileName.trim());
}
