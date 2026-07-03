"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type PatchStage =
  | "idle"
  | "reading-rom"
  | "reading-patch"
  | "validating"
  | "patching"
  | "verifying-output"
  | "preparing-download"
  | "done"
  | "error";

export type PatchProgressInfo = {
  loaded: number;
  total: number;
};

export type PatchResult = {
  blob: Blob;
  fileName: string;
  /** true/false = verified against the patch's declared target checksum; null = format has none to check. */
  outputVerified: boolean | null;
};

export type RunPatchContext = {
  /** Already-computed ROM CRC32 (from useFileAnalysis), reused to avoid re-hashing the ROM. */
  romCrc32?: string;
};

type WorkerMessage =
  | { type: "progress"; stage: PatchStage; loaded: number; total: number }
  | {
      type: "success";
      patchedRomU8Array: Uint8Array<ArrayBuffer>;
      fileName: string;
      outputVerified: boolean | null;
    }
  | { type: "error"; message: string };

const PATCH_OPTIONS = {
  requireValidation: true,
  removeHeader: true,
  fixChecksum: true,
  outputSuffix: true,
} as const;

export function useRomPatcherEngine() {
  const workerRef = useRef<Worker | null>(null);
  const [stage, setStage] = useState<PatchStage>("idle");
  const [progress, setProgress] = useState<PatchProgressInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PatchResult | null>(null);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const reset = useCallback(() => {
    // Terminate any in-flight run — otherwise a stale worker can still post
    // a result/error after the user has moved on to different files, which
    // would silently resurrect this state right after it was cleared.
    workerRef.current?.terminate();
    workerRef.current = null;
    setStage("idle");
    setProgress(null);
    setError(null);
    setResult(null);
  }, []);

  const runPatch = useCallback((romFile: File, patchFile: File, context?: RunPatchContext) => {
    // Start each run with a fresh worker so a previous run's handlers
    // can never race with or overwrite this one's state.
    workerRef.current?.terminate();
    const worker = new Worker("/workers/rom-patcher-worker.js");
    workerRef.current = worker;

    setError(null);
    setResult(null);
    setProgress(null);
    setStage("reading-rom");

    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const data = event.data;
      if (data.type === "progress") {
        setStage(data.stage);
        setProgress(data.loaded || data.total ? { loaded: data.loaded, total: data.total } : null);
      } else if (data.type === "success") {
        const blob = new Blob([data.patchedRomU8Array], { type: "application/octet-stream" });
        setResult({ blob, fileName: data.fileName, outputVerified: data.outputVerified });
        setStage("done");
        setProgress(null);
      } else if (data.type === "error") {
        setError(data.message);
        setStage("error");
        setProgress(null);
      }
    };

    worker.onerror = (event: ErrorEvent) => {
      setError(event.message || "Patching failed unexpectedly.");
      setStage("error");
      setProgress(null);
    };

    worker.postMessage({
      type: "patch",
      romFile,
      patchFile,
      options: PATCH_OPTIONS,
      romCrc32: context?.romCrc32 ?? null,
    });
  }, []);

  return { stage, progress, error, result, runPatch, reset };
}
