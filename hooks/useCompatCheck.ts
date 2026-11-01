"use client";

import { useCallback } from "react";
import { COMPAT_WORKER_URL } from "@/lib/worker-urls";
import { pickWholeRomLimit, readDeviceEnvironment, type CompatResult } from "@/lib/rom-toolkit";
import type { Classified } from "@/lib/worker-session";
import { useWorkerJob } from "@/hooks/useWorkerJob";

export type CompatStatus = "idle" | "checking" | "done" | "error";

type Lane = "rom" | "patch";
type CompatProgress = Partial<Record<Lane, { loaded: number; total: number }>>;

type CompatMessage =
  | { type: "compat-progress"; requestId: string; lane: Lane; loaded: number; total: number }
  | { type: "compat-stage"; requestId: string; budgetMs: number }
  | { type: "compat-result"; requestId: string; data: CompatResult }
  | { type: "error"; requestId: string; message: string; code?: string };

const OPTIONS = {
  createWorker: () => new Worker(COMPAT_WORKER_URL),
  classify(raw: unknown): Classified<CompatProgress, CompatResult> {
    const message = raw as CompatMessage;
    if (message.type === "compat-progress") {
      return { type: "progress", merge: (previous) => ({ ...previous, [message.lane]: { loaded: message.loaded, total: message.total } }) };
    }
    if (message.type === "compat-stage") return { type: "stage", budgetMs: message.budgetMs };
    if (message.type === "compat-result") return { type: "result", result: message.data };
    if (message.type === "error") return { type: "error", message: message.message, code: message.code };
    return { type: "ignore" };
  },
};

/**
 * Runs one ROM + patch compatibility check in the compat worker. Starting a new one, cancel() or leaving the page
 * discards the previous run; a worker that stops responding is terminated from the main thread (see worker-session).
 */
export function useCompatCheck() {
  const job = useWorkerJob<CompatProgress, CompatResult>(OPTIONS);
  const { start } = job;

  const check = useCallback(
    (rom: File, patch: File) => {
      const limit = pickWholeRomLimit(readDeviceEnvironment());
      const limits = { wholeRomBytes: limit.bytes, reason: limit.reason };
      start({ type: "check-compat", rom, patch, limits }, {});
    },
    [start]
  );

  const status: CompatStatus = job.status === "running" ? "checking" : job.status;
  return {
    status,
    progress: job.progress ?? {},
    result: job.result,
    error: job.error,
    check,
    cancel: job.cancel,
    reset: job.cancel,
  };
}
