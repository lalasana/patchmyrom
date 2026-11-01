// Tests for the main-thread worker session (public/workers/worker-session.js): cancellation, the stall watchdog that
// ends a blocked Worker, constructor failures, load failures, races between jobs. A fake Worker and a fake clock stand in
// for the browser, so a Worker that never answers (a parser stuck in a synchronous loop) can be simulated exactly.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const WorkerSession = createRequire(import.meta.url)("../public/workers/worker-session.js");

class FakeWorker {
  constructor() {
    this.posted = [];
    this.terminated = false;
    this.onmessage = null;
    this.onerror = null;
  }
  postMessage(m) {
    this.posted.push(m);
  }
  terminate() {
    this.terminated = true;
  }
  /** What the worker would send back. Ignored after terminate(), like a real terminated worker. */
  say(data) {
    if (!this.terminated && this.onmessage) this.onmessage({ data });
  }
  crash(event) {
    if (!this.terminated && this.onerror) this.onerror(event);
  }
}

function clock() {
  let now = 0;
  let nextId = 1;
  const timers = new Map();
  return {
    set(fn, ms) {
      const id = nextId++;
      timers.set(id, { fn, at: now + ms });
      return id;
    },
    clear(id) {
      timers.delete(id);
    },
    advance(ms) {
      now += ms;
      for (const [id, t] of [...timers]) {
        if (t.at <= now) {
          timers.delete(id);
          t.fn();
        }
      }
    },
    pending: () => timers.size,
  };
}

const classify = (m) => {
  if (m.type === "progress") return { type: "progress", merge: () => ({ loaded: m.loaded, total: m.total }) };
  if (m.type === "stage") return { type: "stage", budgetMs: m.budgetMs };
  if (m.type === "result") return { type: "result", result: m.data };
  if (m.type === "error") return { type: "error", message: m.message, code: m.code };
  return { type: "ignore" };
};

function harness({ stallMs = 30000, factory } = {}) {
  const timers = clock();
  const workers = [];
  const states = [];
  const session = WorkerSession.createSession({
    createWorker: factory || (() => {
      const w = new FakeWorker();
      workers.push(w);
      return w;
    }),
    classify,
    onChange: (s) => states.push(s),
    stallMs,
    timers,
  });
  return { session, timers, workers, states, last: () => states.at(-1) };
}

describe("worker session: normal flow", () => {
  test("posts the request with a request id, reports progress, then the result, and releases the worker", () => {
    const h = harness();
    const id = h.session.start({ type: "go", payload: 1 }, { loaded: 0, total: 10 });
    assert.equal(h.workers.length, 1);
    assert.deepEqual(h.workers[0].posted[0], { requestId: id, type: "go", payload: 1 });
    assert.equal(h.last().status, "running");
    h.workers[0].say({ requestId: id, type: "progress", loaded: 5, total: 10 });
    assert.deepEqual(h.last().progress, { loaded: 5, total: 10 });
    h.workers[0].say({ requestId: id, type: "result", data: { ok: 1 } });
    assert.equal(h.last().status, "done");
    assert.deepEqual(h.last().result, { ok: 1 });
    assert.equal(h.workers[0].terminated, true, "the worker is terminated once its job is finished");
    assert.equal(h.timers.pending(), 0, "no timer is left running");
  });

  test("an error message from the worker ends the job with its own text", () => {
    const h = harness();
    const id = h.session.start({});
    h.workers[0].say({ requestId: id, type: "error", message: "Out of memory", code: "out-of-memory" });
    assert.equal(h.last().status, "error");
    assert.equal(h.last().error.message, "Out of memory");
    assert.equal(h.last().error.code, "out-of-memory");
    assert.equal(h.last().error.suggestReload, false);
    assert.equal(h.workers[0].terminated, true);
  });
});

describe("worker session: cancellation and races", () => {
  test("cancel() terminates the worker, returns to idle and ignores everything the worker says afterwards", () => {
    const h = harness();
    const id = h.session.start({});
    h.session.cancel();
    assert.equal(h.last().status, "idle");
    assert.equal(h.workers[0].terminated, true);
    h.workers[0].say({ requestId: id, type: "result", data: { late: true } });
    assert.equal(h.last().status, "idle", "a late result of a cancelled job is dropped");
    assert.equal(h.timers.pending(), 0);
  });

  test("starting a second job terminates the first; the first job's messages can no longer change anything", () => {
    const h = harness();
    const first = h.session.start({ n: 1 });
    const second = h.session.start({ n: 2 });
    assert.notEqual(first, second);
    assert.equal(h.workers[0].terminated, true);
    h.workers[0].say({ requestId: first, type: "result", data: "first" });
    assert.equal(h.last().status, "running");
    h.workers[1].say({ requestId: second, type: "result", data: "second" });
    assert.equal(h.last().result, "second");
  });

  test("a message that carries another job's request id is ignored", () => {
    const h = harness();
    h.session.start({});
    h.workers[0].say({ requestId: "someone-else", type: "result", data: "wrong" });
    assert.equal(h.last().status, "running");
  });

  test("dispose() (component unmount) stops the worker and the timer without notifying", () => {
    const h = harness();
    h.session.start({});
    const before = h.states.length;
    h.session.dispose();
    assert.equal(h.workers[0].terminated, true);
    assert.equal(h.timers.pending(), 0);
    assert.equal(h.states.length, before);
  });
});

describe("worker session: stall watchdog (a worker blocked in a synchronous parser never answers)", () => {
  test("a worker that never replies is terminated on the main thread when the budget runs out", () => {
    const h = harness({ stallMs: 30000 });
    h.session.start({});
    h.timers.advance(29999);
    assert.equal(h.last().status, "running");
    h.timers.advance(1);
    assert.equal(h.last().status, "error");
    assert.equal(h.last().error.kind, "timeout");
    assert.match(h.last().error.message, /30 seconds/);
    assert.equal(h.workers[0].terminated, true);
    assert.equal(h.timers.pending(), 0);
  });

  test("progress keeps a slow-but-alive job going: every accepted message re-arms the watchdog", () => {
    const h = harness({ stallMs: 30000 });
    const id = h.session.start({});
    for (let i = 0; i < 6; i++) {
      h.timers.advance(20000);
      h.workers[0].say({ requestId: id, type: "progress", loaded: i, total: 10 });
    }
    assert.equal(h.last().status, "running", "two minutes of work with a message every 20 s is not a stall");
    h.timers.advance(30000);
    assert.equal(h.last().error.kind, "timeout");
  });

  test("a worker can announce a longer budget before a long synchronous step, and the watchdog honours it", () => {
    const h = harness({ stallMs: 30000 });
    const id = h.session.start({});
    h.workers[0].say({ requestId: id, type: "stage", budgetMs: 90000 });
    h.timers.advance(89999);
    assert.equal(h.last().status, "running");
    h.timers.advance(1);
    assert.equal(h.last().error.kind, "timeout");
    assert.match(h.last().error.message, /90 seconds/);
  });

  test("after a timeout the tool can be used again: a new job gets a fresh worker and works", () => {
    const h = harness({ stallMs: 1000 });
    h.session.start({});
    h.timers.advance(1000);
    assert.equal(h.last().status, "error");
    const id = h.session.start({ retry: true });
    assert.equal(h.workers.length, 2);
    assert.equal(h.last().status, "running");
    assert.equal(h.last().error, null);
    h.workers[1].say({ requestId: id, type: "result", data: "fine" });
    assert.equal(h.last().result, "fine");
  });

  test("a result that arrives before the deadline cancels the watchdog", () => {
    const h = harness({ stallMs: 1000 });
    const id = h.session.start({});
    h.timers.advance(900);
    h.workers[0].say({ requestId: id, type: "result", data: 1 });
    h.timers.advance(5000);
    assert.equal(h.last().status, "done");
  });
});

describe("worker session: worker construction and load failures", () => {
  test("a Worker constructor that throws (CSP, blocked context) ends in an error state at once — never a spinner", () => {
    const h = harness({
      factory: () => {
        throw Object.assign(new Error("Refused to create a worker"), { name: "SecurityError" });
      },
    });
    h.session.start({});
    assert.equal(h.last().status, "error");
    assert.equal(h.last().error.kind, "construct");
    assert.match(h.last().error.message, /couldn't start the background worker/);
    assert.match(h.last().error.message, /SecurityError/);
    assert.equal(h.last().error.suggestReload, true);
    assert.equal(h.timers.pending(), 0);
  });

  test("a worker script that fails to load (empty error event, e.g. a stale hashed URL after a deploy) gives reload guidance", () => {
    const h = harness();
    h.session.start({});
    h.workers[0].crash({ message: "" });
    assert.equal(h.last().status, "error");
    assert.equal(h.last().error.kind, "worker-load");
    assert.match(h.last().error.message, /reload this page/i);
    assert.equal(h.last().error.suggestReload, true);
    assert.equal(h.workers[0].terminated, true);
  });

  test("an error event without any message property (a plain Event) is treated the same way", () => {
    const h = harness();
    h.session.start({});
    h.workers[0].crash({});
    assert.equal(h.last().error.kind, "worker-load");
  });

  test("an uncaught exception inside the worker reports its message and also suggests a reload", () => {
    const h = harness();
    h.session.start({});
    h.workers[0].crash({ message: "Uncaught RangeError: Array buffer allocation failed" });
    assert.equal(h.last().error.kind, "worker-runtime");
    assert.match(h.last().error.message, /Array buffer allocation failed/);
    assert.doesNotMatch(h.last().error.message, /^Uncaught/);
    assert.equal(h.last().error.suggestReload, true);
  });

  test("postMessage failing (for example a structured-clone error) also ends in an error state", () => {
    const h = harness({
      factory: () => {
        const w = new FakeWorker();
        w.postMessage = () => {
          throw new Error("DataCloneError");
        };
        return w;
      },
    });
    h.session.start({});
    assert.equal(h.last().status, "error");
    assert.equal(h.last().error.kind, "post");
  });

  test("an error after the job finished (worker already terminated) cannot overwrite the result", () => {
    const h = harness();
    const id = h.session.start({});
    const w = h.workers[0];
    w.say({ requestId: id, type: "result", data: "ok" });
    w.crash({ message: "late" });
    assert.equal(h.last().status, "done");
  });
});
