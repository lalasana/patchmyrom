import type { PatchProgressInfo, PatchStage } from "@/hooks/useRomPatcherEngine";
import { formatBytes } from "@/lib/format-bytes";

type PatchProgressProps = {
  stage: PatchStage;
  progress: PatchProgressInfo | null;
};

const STAGE_LABELS: Partial<Record<PatchStage, string>> = {
  "reading-rom": "Reading ROM file…",
  "reading-patch": "Reading patch file…",
  validating: "Validating patch compatibility…",
  patching: "Applying patch…",
  "verifying-output": "Verifying patched output…",
  "preparing-download": "Preparing download…",
};

export default function PatchProgress({ stage, progress }: PatchProgressProps) {
  if (stage === "idle" || stage === "done" || stage === "error") return null;

  const percent =
    progress && progress.total > 0 ? Math.round((progress.loaded / progress.total) * 100) : null;
  const isIndeterminate = percent === null;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card/60 px-4 py-3">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
        {isIndeterminate ? (
          <div className="h-full w-1/3 animate-pulse rounded-full bg-gradient-to-r from-accent-green to-accent-blue" />
        ) : (
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent-green to-accent-blue transition-all"
            style={{ width: `${percent}%` }}
          />
        )}
      </div>
      <p className="text-xs text-muted">
        {STAGE_LABELS[stage]}
        {percent !== null && !isIndeterminate && progress
          ? ` ${percent}% (${formatBytes(progress.loaded)} / ${formatBytes(progress.total)})`
          : ""}
      </p>
    </div>
  );
}
