"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ROM_PATCHER_WORKER_URL } from "@/lib/worker-urls";

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
  /** For xdelta: how many checksum-carrying windows were checked, out of how many. null for other formats. */
  verification?: { checked: number; total: number } | null;
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
      verification?: { checked: number; total: number } | null;
    }
  | { type: "error"; message: string; code?: string };

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
  const [errorCode, setErrorCode] = useState<string | null>(null);
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
    setErrorCode(null);
    setResult(null);
  }, []);

  const runPatch = useCallback((romFile: File, patchFile: File, context?: RunPatchContext) => {
    // Start each run with a fresh worker so a previous run's handlers
    // can never race with or overwrite this one's state.
    workerRef.current?.terminate();
    const worker = new Worker(ROM_PATCHER_WORKER_URL);
    workerRef.current = worker;

    setError(null);
    setErrorCode(null);
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
        setResult({ blob, fileName: data.fileName, outputVerified: data.outputVerified, verification: data.verification ?? null });
        setStage("done");
        setProgress(null);
      } else if (data.type === "error") {
        setError(data.message);
        setErrorCode(data.code ?? null);
        setStage("error");
        setProgress(null);
      }
    };

    worker.onerror = (event: ErrorEvent) => {
      // An empty message means the worker script itself could not load, which after a deploy happens
      // to a tab that was opened on the previous release: reloading fetches the matching worker.
      setError(event.message || "Patching failed unexpectedly. If PatchMyROM was just updated, reload this page and try again.");
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

  return { stage, progress, error, errorCode, result, runPatch, reset };
}
