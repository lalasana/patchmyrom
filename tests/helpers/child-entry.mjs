// Child-process entry for child-run.mjs: reads {workerFile, message} from stdin, runs the real
// worker, prints the terminal message as JSON (patched bytes summarised, not dumped).
import { createWorker, fakeFile } from "./worker-harness.mjs";
import { crc32, hex8 } from "./fixtures.mjs";

let raw = "";
for await (const chunk of process.stdin) raw += chunk;
const { workerFile, message } = JSON.parse(raw);

for (const key of ["romFile", "patchFile", "file", "rom", "patch"]) {
  if (message[key]) message[key] = fakeFile(Buffer.from(message[key].bytes, "base64"), message[key].name);
}

const out = await createWorker(workerFile).run(message);
const summary = { ...out, log: undefined, stageBudgets: (out.log || []).filter((m) => m.type === "compat-stage").map((m) => m.budgetMs) };
if (out.patchedRomU8Array) {
  const bytes = Buffer.from(out.patchedRomU8Array.buffer, out.patchedRomU8Array.byteOffset, out.patchedRomU8Array.byteLength);
  summary.patchedRomU8Array = undefined;
  summary.outputSize = bytes.length;
  summary.outputCrc32 = hex8(crc32(bytes));
}
console.log(JSON.stringify(summary));
