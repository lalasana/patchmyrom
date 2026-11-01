export const BUNDLE_DIR_NAME: string;
export const BUNDLE_URL_PREFIX: string;
export const ENTRY_WORKERS: ReadonlyArray<{ key: string; source: string }>;

export type WorkerUrls = { romPatcher: string; analysis: string; hash: string; compat: string };

export function unversionedWorkerUrls(): WorkerUrls;
export function parseImports(source: string, label: string): { block: string; urls: string[] };
export function buildWorkerBundle(options?: { rootDir?: string; outDir?: string }): {
  urls: WorkerUrls;
  files: string[];
  outDir: string;
};
