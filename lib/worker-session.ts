// Typed entry point to the worker-session controller. The implementation lives in public/workers/worker-session.js
// so the same code runs in the app and in the Node regression tests (with a fake Worker and a fake clock).
import impl from "../public/workers/worker-session.js";

export type SessionErrorKind = "construct" | "worker-load" | "worker-runtime" | "worker-error" | "timeout" | "post";

export type SessionError = {
  kind: SessionErrorKind;
  code: string;
  message: string;
  /** A reload is the likely fix (stale hashed worker URL after a deploy, blocked worker, crashed worker). */
  suggestReload: boolean;
};

export type SessionState<Progress, Result> = {
  status: "idle" | "running" | "done" | "error";
  requestId: string | null;
  progress: Progress | null;
  result: Result | null;
  error: SessionError | null;
};

/** What one worker message means for the session. */
export type Classified<Progress, Result> =
  | { type: "progress"; merge: (previous: Progress | null) => Progress; budgetMs?: number }
  | { type: "stage"; budgetMs: number }
  | { type: "result"; result: Result }
  | { type: "error"; message: string; code?: string }
  | { type: "ignore" };

export type SessionOptions<Progress, Result> = {
  createWorker: () => Worker;
  classify: (message: { requestId?: string } & Record<string, unknown>) => Classified<Progress, Result>;
  onChange: (state: SessionState<Progress, Result>) => void;
  stallMs?: number;
};

export type WorkerSession<Progress, Result> = {
  start(request: Record<string, unknown>, initialProgress?: Progress | null): string;
  cancel(): void;
  reset(): void;
  /** Stops the worker and its timer without notifying (component unmount). */
  dispose(): void;
  getState(): SessionState<Progress, Result>;
};

type WorkerSessionApi = {
  DEFAULT_STALL_MS: number;
  createSession<Progress, Result>(options: SessionOptions<Progress, Result>): WorkerSession<Progress, Result>;
};

const api = impl as unknown as WorkerSessionApi;

export const DEFAULT_STALL_MS = api.DEFAULT_STALL_MS;
export const createSession = api.createSession;
