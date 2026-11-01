import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import { buildWorkerBundle, unversionedWorkerUrls } from "./scripts/worker-bundle.mjs";

export default function nextConfig(phase: string): NextConfig {
  // Web Workers are served from content-hashed URLs in every build (see scripts/worker-bundle.mjs),
  // generated here so it happens however the build is started. `next dev` keeps the plain sources.
  const workerUrls = phase === PHASE_DEVELOPMENT_SERVER ? unversionedWorkerUrls() : buildWorkerBundle().urls;

  return {
    output: "export",
    images: {
      unoptimized: true,
    },
    trailingSlash: true,
    env: {
      NEXT_PUBLIC_ROM_PATCHER_WORKER_URL: workerUrls.romPatcher,
      NEXT_PUBLIC_ANALYSIS_WORKER_URL: workerUrls.analysis,
    },
  };
}
