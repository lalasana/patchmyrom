"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HASH_WORKER_URL } from "@/lib/worker-urls";
import type { HashResult } from "@/lib/rom-toolkit";

export type HashStatus = "idle" | "hashing" | "done" | "error";

type HashMessage =
  | { type: "hash-progress"; requestId: string; loaded: number; total: number }
  | { type: "hash-result"; requestId: string; data: HashResult }
  | { type: "error"; requestId: string; message: string };

let counter = 0;

/** Streams one file through the checksum worker. Selecting another file (or cancel/reset) discards the previous run. */
export function useRomHashes() {
  const workerRef = useRef<Worker | null>(null);
  const activeId = useRef<string | null>(null);
  const [status, setStatus] = useState<HashStatus>("idle");
  const [progress, setProgress] = useState<{ loaded: number; total: number } | null>(null);
  const [result, setResult] = useState<HashResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopWorker = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    activeId.current = null;
  }, []);

  useEffect(() => stopWorker, [stopWorker]);

  const reset = useCallback(() => {
    stopWorker();
    setStatus("idle");
    setProgress(null);
    setResult(null);
    setError(null);
  }, [stopWorker]);

  const hashFile = useCallback(
    (file: File) => {
      stopWorker(); // a fresh worker per file: cancels any run in flight and frees its memory
      const requestId = `hash-${++counter}-${Date.now()}`;
      activeId.current = requestId;
      setStatus("hashing");
      setProgress({ loaded: 0, total: file.size });
      setResult(null);
      setError(null);

      const worker = new Worker(HASH_WORKER_URL);
      workerRef.current = worker;
      worker.onmessage = (event: MessageEvent<HashMessage>) => {
        const message = event.data;
        if (message.requestId !== activeId.current) return;
        if (message.type === "hash-progress") {
          setProgress({ loaded: message.loaded, total: message.total });
        } else if (message.type === "hash-result") {
          setResult(message.data);
          setStatus("done");
          setProgress(null);
          stopWorker();
        } else if (message.type === "error") {
          setError(message.message);
          setStatus("error");
          setProgress(null);
          stopWorker();
        }
      };
      worker.onerror = (event: ErrorEvent) => {
        if (activeId.current !== requestId) return;
        setError(event.message || "The checksum calculation failed unexpectedly.");
        setStatus("error");
        setProgress(null);
        stopWorker();
      };
      worker.postMessage({ type: "hash-file", requestId, file });
    },
    [stopWorker]
  );

  return { status, progress, result, error, hashFile, cancel: reset, reset };
}
