/*
 * Main-thread controller for one Web Worker job (used by the ROM toolkit hooks).
 *
 * Why it exists. A job is "post one request, receive progress messages and one result". Doing that safely
 * needs more than onmessage:
 *   - constructing a Worker can throw synchronously (a Content-Security-Policy, a privacy extension, an
 *     unsupported context) — the UI must not be left spinning;
 *   - a Worker that fails to LOAD (a hashed URL that no longer exists after a deploy, a network error) only
 *     fires an `error` event with an empty message;
 *   - a Worker stuck in a synchronous parser can never answer or time itself out, so the timeout has to live
 *     HERE, on the main thread, and end the job with terminate();
 *   - starting a new job, cancelling, or leaving the page must make every late message from the old Worker
 *     harmless (each job has its own request id and its own Worker, which is terminated).
 *
 * Pure JavaScript with injectable Worker factory and timers, so the same file runs in the app (through
 * lib/worker-session.ts) and in the Node regression tests with a fake Worker and a fake clock.
 *
 * Stall watchdog: the job fails with kind "timeout" when no accepted message arrives for `stallMs`. Every
 * accepted message re-arms it; a worker about to do a long synchronous step can announce how long it needs
 * with a message that classify() maps to { type: "stage", budgetMs }.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module && module.exports) {
    module.exports = api;
  } else {
    root.WorkerSession = api;
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var DEFAULT_STALL_MS = 30000;

  var MESSAGES = {
    construct:
      "Your browser couldn't start the background worker this tool needs. A security policy or a privacy extension may be blocking it. Reload the page; if it keeps happening, try another browser.",
    workerLoad:
      "The tool's background worker couldn't be loaded. If PatchMyROM was just updated, reload this page and try again.",
    post: "The file couldn't be handed to the background worker. Reload the page and try again.",
  };

  function describeConstructError(err) {
    var name = err && err.name ? " (" + err.name + ")" : "";
    return MESSAGES.construct.replace("worker this tool needs.", "worker this tool needs" + name + ".");
  }

  function describeWorkerError(event) {
    var message = event && typeof event.message === "string" ? event.message.trim() : "";
    if (!message) {
      // A script that could not be fetched or parsed fires an error event without any message.
      return { kind: "worker-load", code: "worker-load", message: MESSAGES.workerLoad, suggestReload: true };
    }
    return {
      kind: "worker-runtime",
      code: "worker-runtime",
      message: "Something went wrong inside the background worker (" + message.replace(/^Uncaught\s+/, "") + "). Reload the page and try again.",
      suggestReload: true,
    };
  }

  function describeTimeout(stallMs) {
    var seconds = Math.round(stallMs / 1000);
    return {
      kind: "timeout",
      code: "timeout",
      message:
        "This stopped responding for " +
        seconds +
        " seconds, so it was cancelled to keep your browser responsive. The file may be damaged or unusually complex. You can try again or choose a different file.",
      suggestReload: false,
    };
  }

  /**
   * @param {object} options
   * @param {() => Worker} options.createWorker        may throw
   * @param {(message:any) => ({type:"progress", merge:(prev:any)=>any, budgetMs?:number} | {type:"result", result:any} |
   *          {type:"error", message:string, code?:string} | {type:"stage", budgetMs:number} | {type:"ignore"})} options.classify
   * @param {(state:any) => void} options.onChange     called with a snapshot after every state change
   * @param {number} [options.stallMs]
   * @param {{set:(fn:()=>void, ms:number)=>any, clear:(handle:any)=>void}} [options.timers]
   */
  function createSession(options) {
    var stallMs = typeof options.stallMs === "number" ? options.stallMs : DEFAULT_STALL_MS;
    var timers = options.timers || {
      set: function (fn, ms) {
        return setTimeout(fn, ms);
      },
      clear: function (handle) {
        clearTimeout(handle);
      },
    };

    var worker = null;
    var timer = null;
    var counter = 0;
    var state = { status: "idle", requestId: null, progress: null, result: null, error: null };

    function snapshot() {
      return { status: state.status, requestId: state.requestId, progress: state.progress, result: state.result, error: state.error };
    }

    function emit() {
      options.onChange(snapshot());
    }

    function disarm() {
      if (timer !== null) {
        timers.clear(timer);
        timer = null;
      }
    }

    function arm(ms) {
      disarm();
      var budget = typeof ms === "number" && ms > 0 ? ms : stallMs;
      timer = timers.set(function () {
        timer = null;
        fail(describeTimeout(budget));
      }, budget);
    }

    function release() {
      disarm();
      if (worker) {
        var w = worker;
        worker = null;
        w.onmessage = null;
        w.onerror = null;
        try {
          w.terminate();
        } catch {
          /* already gone */
        }
      }
    }

    function fail(error) {
      release();
      state = { status: "error", requestId: null, progress: null, result: null, error: error };
      emit();
    }

    function start(request, initialProgress) {
      release();
      counter += 1;
      var id = "job-" + counter;
      state = { status: "running", requestId: id, progress: initialProgress === undefined ? null : initialProgress, result: null, error: null };
      emit();

      var created;
      try {
        created = options.createWorker();
      } catch (err) {
        fail({ kind: "construct", code: "worker-construct", message: describeConstructError(err), suggestReload: true });
        return id;
      }
      worker = created;

      created.onmessage = function (event) {
        var message = event && event.data;
        if (worker !== created || !message || message.requestId !== id) return; // a late message of a finished/cancelled job
        var c = options.classify(message);
        if (c.type === "progress") {
          state = { status: "running", requestId: id, progress: c.merge(state.progress), result: null, error: null };
          arm(c.budgetMs);
          emit();
        } else if (c.type === "stage") {
          arm(c.budgetMs);
        } else if (c.type === "result") {
          release();
          state = { status: "done", requestId: id, progress: null, result: c.result, error: null };
          emit();
        } else if (c.type === "error") {
          fail({ kind: "worker-error", code: c.code || "worker-error", message: c.message, suggestReload: false });
        }
      };
      created.onerror = function (event) {
        if (worker !== created) return;
        fail(describeWorkerError(event));
      };

      arm(stallMs);
      try {
        created.postMessage(Object.assign({ requestId: id }, request));
      } catch {
        fail({ kind: "post", code: "worker-post", message: MESSAGES.post, suggestReload: true });
      }
      return id;
    }

    function cancel() {
      release();
      state = { status: "idle", requestId: null, progress: null, result: null, error: null };
      emit();
    }

    return {
      start: start,
      cancel: cancel,
      reset: cancel,
      /** Stops the Worker and the timer without notifying anyone (component unmount). */
      dispose: release,
      getState: snapshot,
    };
  }

  return {
    DEFAULT_STALL_MS: DEFAULT_STALL_MS,
    createSession: createSession,
    describeWorkerError: describeWorkerError,
    describeConstructError: describeConstructError,
    describeTimeout: describeTimeout,
  };
});
