// Typed entry point to the shared compatibility classifier. The implementation lives in
// public/workers/patch-compat.js so the very same code runs inside the web workers, in the
// UI, and in the Node regression tests — see the header of that file.
import impl from "../public/workers/patch-compat.js";

export type CompatStatus = "compatible" | "already-patched" | "incompatible" | "unverifiable";

export type CompatLevel = "ok" | "info" | "warning" | "unknown";

export type CompatDetail = { label: string; value: string };

export type CompatVerdict = {
  status: CompatStatus;
  /** Stable machine-readable reason, e.g. "rom-already-patched". */
  code: string;
  level: CompatLevel;
  /** true = patching must not proceed with this ROM. */
  blocking: boolean;
  /** true = the verdict was reached on the ROM with a recognised copier header set aside. */
  headerRemoved: boolean;
  title: string;
  message: string;
  details: CompatDetail[];
};

export type CompatRomInput = {
  size: number;
  crc32: string;
  headerless?: { name: string; headerSize: number; size: number; crc32: string } | null;
};

export type CompatPatchInput = {
  sourceSize: number | null;
  targetSize: number | null;
  sourceCrc32: string | null;
  targetCrc32: string | null;
};

type PatchCompatApi = {
  classify(input: { rom: CompatRomInput; patch: CompatPatchInput }): CompatVerdict;
  toPlainText(verdict: CompatVerdict): string;
};

const api = impl as unknown as PatchCompatApi;

export const classifyCompatibility = api.classify;
export const verdictToPlainText = api.toPlainText;
