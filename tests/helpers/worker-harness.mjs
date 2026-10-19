// Loads the REAL web workers (public/workers/*.js) inside a Node vm context that
// mimics a DedicatedWorkerGlobalScope, so tests exercise the exact code that ships
// to browsers — including the vendored RomPatcher.js — with no browser required.
import vm from "node:vm";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { webcrypto } from "node:crypto";

export const PUBLIC_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../public");

/** Minimal stand-in for a browser File: name/size/type + slice().arrayBuffer(). */
export function fakeFile(bytes, name, type = "") {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return {
    name,
    type,
    size: u8.length,
    lastModified: 0,
    __bytes: u8, // test-only: lets child-run.mjs ship the file to a subprocess
    slice(start, end) {
      const part = u8.subarray(start, end);
      return {
        arrayBuffer: async () => part.buffer.slice(part.byteOffset, part.byteOffset + part.byteLength),
      };
    },
  };
}

const TERMINAL_TYPES = new Set(["success", "error", "rom-result", "patch-result"]);

/**
 * Boots a worker script. Returns `run(message)`, which posts a message to the worker and
 * resolves with the first terminal message ("success" / "error" / "*-result"), plus every
 * message posted during that run under `.log`.
 */
export function createWorker(workerFile) {
  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    crypto: webcrypto,
    TextDecoder,
    TextEncoder,
  };
  sandbox.self = sandbox;
  // BinFile.RUNTIME_ENVIROMENT checks `self instanceof WorkerGlobalScope`.
  sandbox.WorkerGlobalScope = function WorkerGlobalScope() {};
  Object.defineProperty(sandbox.WorkerGlobalScope, Symbol.hasInstance, { value: () => true });
  sandbox.postMessage = () => {};
  sandbox.importScripts = (...urls) => {
    for (const url of urls) {
      const file = path.join(PUBLIC_DIR, url);
      vm.runInContext(fs.readFileSync(file, "utf8"), ctx, { filename: file });
    }
  };

  const ctx = vm.createContext(sandbox);
  const workerPath = path.join(PUBLIC_DIR, "workers", workerFile);
  vm.runInContext(fs.readFileSync(workerPath, "utf8"), ctx, { filename: workerPath });

  return {
    context: ctx,
    run(message) {
      return new Promise((resolve) => {
        const log = [];
        sandbox.postMessage = (m) => {
          log.push(m);
          if (TERMINAL_TYPES.has(m.type)) resolve(Object.assign({}, m, { log }));
        };
        sandbox.onmessage({ data: message });
      });
    },
  };
}
