// URLs of the Web Workers. In a production build next.config.ts publishes content-hashed URLs
// (see scripts/worker-bundle.mjs), so a deploy can never leave a browser running a cached worker
// next to a new page. The fallback is the plain source file: it is what `next dev` uses, and what
// runs if these variables are ever missing.
export const ROM_PATCHER_WORKER_URL = process.env.NEXT_PUBLIC_ROM_PATCHER_WORKER_URL || "/workers/rom-patcher-worker.js";

export const ANALYSIS_WORKER_URL = process.env.NEXT_PUBLIC_ANALYSIS_WORKER_URL || "/workers/analysis-worker.js";

// ROM toolkit: streaming checksum worker and the ROM/patch compatibility worker.
export const HASH_WORKER_URL = process.env.NEXT_PUBLIC_HASH_WORKER_URL || "/workers/hash-worker.js";

export const COMPAT_WORKER_URL = process.env.NEXT_PUBLIC_COMPAT_WORKER_URL || "/workers/compat-worker.js";
