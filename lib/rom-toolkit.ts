// Typed entry point to the ROM-toolkit core. The implementation lives in public/workers/rom-toolkit.js
// so the very same code runs in the web workers, in the UI (checksum comparison, report text) and in
// the Node regression tests — see the header of that file.
import impl from "../public/workers/rom-toolkit.js";

export type HashAlgorithm = "crc32" | "md5" | "sha1" | "sha256";

export type RomHashes = Record<HashAlgorithm, string>;

export type PlatformConfidence = "confirmed" | "extension-only" | "unknown";

export type PlatformInfo = {
  platform: string | null;
  family: string | null;
  confidence: PlatformConfidence;
  extension: string;
  extensionPlatform: string | null;
  evidence: string[];
  notes: string[];
  /** The file extension and the file's own header point at different platforms. */
  conflict: boolean;
  snes: { mapping: string | null; copierHeader: boolean; validated: boolean; sizeSuggestsHeader: boolean } | null;
};

export type ExpectedChecksum = { algorithm: HashAlgorithm; value: string; padded?: boolean };

export type ParsedChecksums =
  | { ok: true; items: ExpectedChecksum[] }
  | { ok: false; code: string; message: string };

export type ChecksumComparison = {
  overall: "match" | "mismatch";
  results: { algorithm: HashAlgorithm; label: string; expected: string; actual: string; match: boolean }[];
};

export type CompatState = "compatible" | "mismatch" | "cannot-verify";

export type CompatReport = {
  state: CompatState;
  code: string;
  level: "ok" | "warning" | "unknown" | "info";
  headline: string;
  summary: string;
  alreadyPatched: boolean;
  /** One sentence on exactly what was compared (or why nothing could be). */
  verification: string;
  evidence: { label: string; value: string; status: "ok" | "bad" | "info" }[];
  findings: { level: "info" | "warning"; title: string; message: string }[];
  steps: string[];
};

export type HashResult = {
  fileName: string;
  fileSize: number;
  hashes: RomHashes;
  platform: PlatformInfo;
  elapsedMs: number;
};

export type CompatResult = {
  rom: {
    fileName: string;
    size: number;
    crc32: string;
    headerless: { name: string; headerSize: number; size: number; crc32: string } | null;
    platform: PlatformInfo;
  };
  patch: {
    fileName: string;
    size: number;
    recognized: boolean;
    format: string | null;
    title: string | null;
    sourceSize: number | null;
    targetSize: number | null;
    sourceCrc32: string | null;
    targetCrc32: string | null;
    noValidation: boolean;
  };
  report: CompatReport;
};

/** What the browser tells us about the device; both parts are optional (Firefox and Safari don't report memory). */
export type DeviceEnvironment = { deviceMemory?: number | null; mobile?: boolean };

export type WholeRomLimit = { bytes: number; tier: string; reason: string };

type RomToolkitApi = {
  ALGORITHMS: Record<HashAlgorithm, { label: string; length: number }>;
  parseExpectedChecksums(text: string): ParsedChecksums;
  compareChecksums(actual: RomHashes, items: ExpectedChecksum[]): ChecksumComparison;
  formatLabel(name: string | null): string;
  reportToPlainText(report: CompatReport): string;
  pickWholeRomLimit(env?: DeviceEnvironment): WholeRomLimit;
  deviceEnvironmentFrom(nav: unknown): DeviceEnvironment;
  progressBucket(loaded: number, total: number): number;
};

const api = impl as unknown as RomToolkitApi;

export const HASH_ALGORITHMS = api.ALGORITHMS;
export const parseExpectedChecksums = api.parseExpectedChecksums;
export const compareChecksums = api.compareChecksums;
export const compatFormatLabel = api.formatLabel;
export const compatReportToPlainText = api.reportToPlainText;
export const pickWholeRomLimit = api.pickWholeRomLimit;
export const progressBucket = api.progressBucket;

/** Reads the device facts the whole-ROM limit depends on. Browser only; returns {} where there is no navigator. */
export function readDeviceEnvironment(): DeviceEnvironment {
  return typeof navigator === "undefined" ? {} : api.deviceEnvironmentFrom(navigator);
}

export const HASH_ORDER: HashAlgorithm[] = ["crc32", "md5", "sha1", "sha256"];
