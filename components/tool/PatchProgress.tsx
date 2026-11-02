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
    <div className="flex flex-col gap-2.5 rounded-xl border border-accent-green/30 bg-accent-green/5 px-4 py-3.5 shadow-[0_0_30px_-14px_rgba(57,224,127,0.6)]">
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-background/70 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]">
        {isIndeterminate ? (
          <div className="progress-stripes h-full w-1/3 rounded-full bg-gradient-to-r from-accent-green to-accent-blue" />
        ) : (
          <div
            className="progress-stripes h-full rounded-full bg-gradient-to-r from-accent-green to-accent-blue transition-all"
            style={{ width: `${percent}%` }}
          />
        )}
      </div>
      <p className="text-xs font-medium text-foreground/80">
        {STAGE_LABELS[stage]}
        {percent !== null && !isIndeterminate && progress
          ? ` ${percent}% (${formatBytes(progress.loaded)} / ${formatBytes(progress.total)})`
          : ""}
      </p>
    </div>
  );
}
