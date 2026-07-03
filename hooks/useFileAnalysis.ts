"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AnalysisStatus = "idle" | "analyzing" | "done" | "error";

export type AnalysisProgressInfo = {
  loaded: number;
  total: number;
};

export type RomAnalysis = {
  fileName: string;
  fileSize: number;
  extension: string;
  platform: string | null;
  detectionMethod: "extension" | "extension+magic";
  crc32: string;
  md5: string;
  sha1: string;
  sha256: string;
};

export type PatchAnalysis = {
  fileName: string;
  fileSize: number;
  recognized: boolean;
  format: string | null;
  title: string | null;
  sourceSize: number | null;
  targetSize: number | null;
  sourceChecksumCRC32: string | null;
  targetChecksumCRC32: string | null;
  canValidateSource: boolean;
};

type AnalysisResponse =
  | { type: "rom-progress"; requestId: string; loaded: number; total: number }
  | { type: "rom-result"; requestId: string; cacheKey: string; data: RomAnalysis }
  | { type: "patch-progress"; requestId: string; loaded: number; total: number }
  | { type: "patch-result"; requestId: string; cacheKey: string; data: PatchAnalysis }
  | { type: "error"; requestId: string; lane: "rom" | "patch"; message: string };

function cacheKeyFor(file: File): string {
  return `${file.name}::${file.size}::${file.lastModified}`;
}

let requestCounter = 0;
function nextRequestId(): string {
  requestCounter += 1;
  return `req-${requestCounter}-${Date.now()}`;
}

export function useFileAnalysis() {
  const workerRef = useRef<Worker | null>(null);
  const romCacheRef = useRef(new Map<string, RomAnalysis>());
  const patchCacheRef = useRef(new Map<string, PatchAnalysis>());
  const latestRomRequestId = useRef<string | null>(null);
  const latestPatchRequestId = useRef<string | null>(null);

  const [romAnalysis, setRomAnalysis] = useState<RomAnalysis | null>(null);
  const [romStatus, setRomStatus] = useState<AnalysisStatus>("idle");
  const [romProgress, setRomProgress] = useState<AnalysisProgressInfo | null>(null);
  const [romError, setRomError] = useState<string | null>(null);

  const [patchAnalysis, setPatchAnalysis] = useState<PatchAnalysis | null>(null);
  const [patchStatus, setPatchStatus] = useState<AnalysisStatus>("idle");
  const [patchProgress, setPatchProgress] = useState<AnalysisProgressInfo | null>(null);
  const [patchError, setPatchError] = useState<string | null>(null);

  function getWorker(): Worker {
    if (!workerRef.current) {
      const worker = new Worker("/workers/analysis-worker.js");
      worker.onmessage = (event: MessageEvent<AnalysisResponse>) => {
        const data = event.data;

        if (data.type === "rom-progress") {
          if (data.requestId !== latestRomRequestId.current) return;
          setRomProgress({ loaded: data.loaded, total: data.total });
          return;
        }
        if (data.type === "rom-result") {
          if (data.requestId !== latestRomRequestId.current) return;
          romCacheRef.current.set(data.cacheKey, data.data);
          setRomAnalysis(data.data);
          setRomStatus("done");
          setRomProgress(null);
          latestRomRequestId.current = null;
          return;
        }
        if (data.type === "patch-progress") {
          if (data.requestId !== latestPatchRequestId.current) return;
          setPatchProgress({ loaded: data.loaded, total: data.total });
          return;
        }
        if (data.type === "patch-result") {
          if (data.requestId !== latestPatchRequestId.current) return;
          patchCacheRef.current.set(data.cacheKey, data.data);
          setPatchAnalysis(data.data);
          setPatchStatus("done");
          setPatchProgress(null);
          latestPatchRequestId.current = null;
          return;
        }
        if (data.type === "error") {
          if (data.lane === "rom") {
            if (data.requestId !== latestRomRequestId.current) return;
            setRomError(data.message);
            setRomStatus("error");
            setRomProgress(null);
            latestRomRequestId.current = null;
          } else {
            if (data.requestId !== latestPatchRequestId.current) return;
            setPatchError(data.message);
            setPatchStatus("error");
            setPatchProgress(null);
            latestPatchRequestId.current = null;
          }
        }
      };
      worker.onerror = (event: ErrorEvent) => {
        // A worker-level error (e.g. a script failed to load) isn't scoped
        // to one lane, so only clobber lanes that actually have a request
        // outstanding right now — otherwise this can overwrite an
        // already-completed, unrelated analysis with a false error.
        const message = event.message || "Analysis failed unexpectedly.";
        if (latestRomRequestId.current !== null) {
          setRomError(message);
          setRomStatus("error");
          setRomProgress(null);
          latestRomRequestId.current = null;
        }
        if (latestPatchRequestId.current !== null) {
          setPatchError(message);
          setPatchStatus("error");
          setPatchProgress(null);
          latestPatchRequestId.current = null;
        }
      };
      workerRef.current = worker;
    }
    return workerRef.current;
  }

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const analyzeRom = useCallback((file: File) => {
    const key = cacheKeyFor(file);
    const cached = romCacheRef.current.get(key);
    if (cached) {
      latestRomRequestId.current = null;
      setRomAnalysis(cached);
      setRomStatus("done");
      setRomError(null);
      setRomProgress(null);
      return;
    }

    const requestId = nextRequestId();
    latestRomRequestId.current = requestId;
    setRomAnalysis(null);
    setRomError(null);
    setRomProgress(null);
    setRomStatus("analyzing");

    const worker = getWorker();
    worker.postMessage({ type: "analyze-rom", requestId, file, cacheKey: key });
  }, []);

  const analyzePatch = useCallback((file: File) => {
    const key = cacheKeyFor(file);
    const cached = patchCacheRef.current.get(key);
    if (cached) {
      latestPatchRequestId.current = null;
      setPatchAnalysis(cached);
      setPatchStatus("done");
      setPatchError(null);
      setPatchProgress(null);
      return;
    }

    const requestId = nextRequestId();
    latestPatchRequestId.current = requestId;
    setPatchAnalysis(null);
    setPatchError(null);
    setPatchProgress(null);
    setPatchStatus("analyzing");

    const worker = getWorker();
    worker.postMessage({ type: "analyze-patch", requestId, file, cacheKey: key });
  }, []);

  const clearRom = useCallback(() => {
    latestRomRequestId.current = null;
    setRomAnalysis(null);
    setRomStatus("idle");
    setRomError(null);
    setRomProgress(null);
  }, []);

  const clearPatch = useCallback(() => {
    latestPatchRequestId.current = null;
    setPatchAnalysis(null);
    setPatchStatus("idle");
    setPatchError(null);
    setPatchProgress(null);
  }, []);

  return {
    romAnalysis,
    romStatus,
    romProgress,
    romError,
    patchAnalysis,
    patchStatus,
    patchProgress,
    patchError,
    analyzeRom,
    analyzePatch,
    clearRom,
    clearPatch,
  };
}
