"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { COMPAT_WORKER_URL } from "@/lib/worker-urls";
import type { CompatResult } from "@/lib/rom-toolkit";

export type CompatStatus = "idle" | "checking" | "done" | "error";

type Lane = "rom" | "patch";

type CompatMessage =
  | { type: "compat-progress"; requestId: string; lane: Lane; loaded: number; total: number }
  | { type: "compat-result"; requestId: string; data: CompatResult }
  | { type: "error"; requestId: string; message: string };

let counter = 0;

/** Runs one ROM + patch compatibility check in the compat worker; starting a new one (or reset) discards the previous. */
export function useCompatCheck() {
  const workerRef = useRef<Worker | null>(null);
  const activeId = useRef<string | null>(null);
  const [status, setStatus] = useState<CompatStatus>("idle");
  const [progress, setProgress] = useState<Partial<Record<Lane, { loaded: number; total: number }>>>({});
  const [result, setResult] = useState<CompatResult | null>(null);
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
    setProgress({});
    setResult(null);
    setError(null);
  }, [stopWorker]);

  const check = useCallback(
    (rom: File, patch: File) => {
      stopWorker();
      const requestId = `compat-${++counter}-${Date.now()}`;
      activeId.current = requestId;
      setStatus("checking");
      setProgress({});
      setResult(null);
      setError(null);

      const worker = new Worker(COMPAT_WORKER_URL);
      workerRef.current = worker;
      worker.onmessage = (event: MessageEvent<CompatMessage>) => {
        const message = event.data;
        if (message.requestId !== activeId.current) return;
        if (message.type === "compat-progress") {
          setProgress((prev) => ({ ...prev, [message.lane]: { loaded: message.loaded, total: message.total } }));
        } else if (message.type === "compat-result") {
          setResult(message.data);
          setStatus("done");
          setProgress({});
          stopWorker();
        } else if (message.type === "error") {
          setError(message.message);
          setStatus("error");
          setProgress({});
          stopWorker();
        }
      };
      worker.onerror = (event: ErrorEvent) => {
        if (activeId.current !== requestId) return;
        setError(event.message || "The compatibility check failed unexpectedly.");
        setStatus("error");
        setProgress({});
        stopWorker();
      };
      worker.postMessage({ type: "check-compat", requestId, rom, patch });
    },
    [stopWorker]
  );

  return { status, progress, result, error, check, reset };
}
