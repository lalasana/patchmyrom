"use client";

import type { AnalysisProgressInfo, AnalysisStatus, PatchAnalysis } from "@/hooks/useFileAnalysis";
import { IconAlertTriangle, IconPatchFile } from "@/components/ui/icons";
import { FormatBadge } from "@/components/ui/FormatBadge";
import { formatBytes } from "@/lib/format-bytes";
import { getFormatDisplayName, mapDetectedFormatToChipKey } from "@/lib/format-labels";

type PatchAnalysisPanelProps = {
  analysis: PatchAnalysis | null;
  status: AnalysisStatus;
  progress: AnalysisProgressInfo | null;
  error: string | null;
};

export default function PatchAnalysisPanel({ analysis, status, progress, error }: PatchAnalysisPanelProps) {
  if (status === "idle") return null;

  if (status === "analyzing") {
    const percent = progress && progress.total > 0 ? Math.round((progress.loaded / progress.total) * 100) : null;
    return (
      <p className="text-xs text-muted">
        Analyzing patch…{percent !== null ? ` ${percent}%` : ""}
      </p>
    );
  }

  if (status === "error") {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
        <IconAlertTriangle className="h-4 w-4 flex-none text-amber-400" />
        <p>{error ?? "Could not analyze this file."}</p>
      </div>
    );
  }

  if (!analysis) return null;

  if (!analysis.recognized) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
        <IconAlertTriangle className="h-4 w-4 flex-none text-amber-400" />
        <p>
          Unrecognized patch format — this file doesn&apos;t match any supported patch signature
          (IPS, UPS, BPS, xdelta, and a few others).
        </p>
      </div>
    );
  }

  const chipKey = mapDetectedFormatToChipKey(analysis.format);

  return (
    <div className="rounded-lg border border-border bg-card/40 px-3 py-2.5 text-xs">
      <div className="flex items-center gap-2">
        {chipKey ? (
          <FormatBadge format={chipKey} />
        ) : (
          <div className="rounded-lg border border-border bg-card-hover px-3.5 py-3">
            <span className="text-sm font-bold text-foreground">{getFormatDisplayName(analysis.format)}</span>
            <p className="mt-0.5 text-xs text-muted">Format auto-detected</p>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2 text-muted">
        <IconPatchFile className="h-3.5 w-3.5 flex-none text-accent-blue" />
        <span>{formatBytes(analysis.fileSize)}</span>
      </div>

      {analysis.title && (
        <p className="mt-1.5 text-foreground">
          <span className="text-muted">Title:</span> {analysis.title}
        </p>
      )}

      <p className="mt-1.5 text-[11px] text-muted/70">
        {analysis.canValidateSource
          ? "This format embeds a checksum — compatibility can be checked before applying."
          : "This format doesn't embed a checksum, so compatibility can't be pre-verified."}
      </p>
    </div>
  );
}
