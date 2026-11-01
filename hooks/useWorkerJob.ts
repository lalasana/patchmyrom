"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createSession, type SessionOptions, type SessionState, type WorkerSession } from "@/lib/worker-session";

type JobOptions<Progress, Result> = Pick<SessionOptions<Progress, Result>, "createWorker" | "classify" | "stallMs">;

const IDLE = { status: "idle", requestId: null, progress: null, result: null, error: null } as const;

/**
 * React binding of the worker session: one job at a time, a fresh Worker per job, cancel(), a main-thread
 * stall timeout and failure reporting (constructor errors, scripts that fail to load). `options` must be
 * a module-level constant so the session is created once per mount.
 */
export function useWorkerJob<Progress, Result>(options: JobOptions<Progress, Result>) {
  const [state, setState] = useState<SessionState<Progress, Result>>(IDLE);
  const sessionRef = useRef<WorkerSession<Progress, Result> | null>(null);

  useEffect(() => {
    const session = createSession<Progress, Result>({ ...options, onChange: setState });
    sessionRef.current = session;
    return () => {
      session.dispose();
      sessionRef.current = null;
    };
  }, [options]);

  const start = useCallback((request: Record<string, unknown>, initialProgress?: Progress | null) => {
    sessionRef.current?.start(request, initialProgress);
  }, []);

  const cancel = useCallback(() => {
    sessionRef.current?.cancel();
  }, []);

  return { ...state, start, cancel };
}
