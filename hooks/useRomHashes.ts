"use client";

import { useCallback } from "react";
import { HASH_WORKER_URL } from "@/lib/worker-urls";
import type { HashResult } from "@/lib/rom-toolkit";
import type { Classified } from "@/lib/worker-session";
import { useWorkerJob } from "@/hooks/useWorkerJob";

export type HashStatus = "idle" | "hashing" | "done" | "error";

type HashProgress = { loaded: number; total: number };

type HashMessage =
  | { type: "hash-progress"; requestId: string; loaded: number; total: number }
  | { type: "hash-result"; requestId: string; data: HashResult }
  | { type: "error"; requestId: string; message: string; code?: string };

const OPTIONS = {
  createWorker: () => new Worker(HASH_WORKER_URL),
  classify(raw: unknown): Classified<HashProgress, HashResult> {
    const message = raw as HashMessage;
    if (message.type === "hash-progress") return { type: "progress", merge: () => ({ loaded: message.loaded, total: message.total }) };
    if (message.type === "hash-result") return { type: "result", result: message.data };
    if (message.type === "error") return { type: "error", message: message.message, code: message.code };
    return { type: "ignore" };
  },
};

/** Streams one file through the checksum worker. Selecting another file (or cancel/reset) discards the previous run. */
export function useRomHashes() {
  const job = useWorkerJob<HashProgress, HashResult>(OPTIONS);
  const { start } = job;

  const hashFile = useCallback(
    (file: File) => {
      start({ type: "hash-file", file }, { loaded: 0, total: file.size }); // a fresh worker per file frees the previous one's memory
    },
    [start]
  );

  const status: HashStatus = job.status === "running" ? "hashing" : job.status;
  return { status, progress: job.progress, result: job.result, error: job.error, hashFile, cancel: job.cancel, reset: job.cancel };
}
