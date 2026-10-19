// Runs one worker message in a throw-away child process with a hard timeout.
//
// Used for inputs that could, if the guards regress, send the vendored parsers into an
// endless loop — which would otherwise freeze the whole test run instead of failing it.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const CHILD = fileURLToPath(new URL("./child-entry.mjs", import.meta.url));

const b64 = (u8) => Buffer.from(u8).toString("base64");

/** @returns {{ timedOut: boolean, result: object|null, stderr: string }} */
export function runInChild(workerFile, message, { timeoutMs = 15000 } = {}) {
  const payload = { workerFile, message: { ...message } };
  for (const key of ["romFile", "patchFile", "file"]) {
    if (message[key]) payload.message[key] = { name: message[key].name, bytes: b64(message[key].__bytes) };
  }
  const res = spawnSync(process.execPath, [CHILD], {
    input: JSON.stringify(payload),
    timeout: timeoutMs,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (res.error && res.error.code === "ETIMEDOUT") return { timedOut: true, result: null, stderr: "" };
  let result = null;
  try {
    result = JSON.parse(res.stdout);
  } catch {
    /* leave null; caller asserts on it */
  }
  return { timedOut: false, result, stderr: res.stderr };
}
