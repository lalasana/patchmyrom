"use client";

import { useEffect, useRef, useState } from "react";
import FileDropZone from "@/components/tool/FileDropZone";
import FormatSelector, { PATCH_FORMATS, type PatchFormat } from "@/components/tool/FormatSelector";
import PatchProgress from "@/components/tool/PatchProgress";
import DownloadResult from "@/components/tool/DownloadResult";
import RomAnalysisPanel from "@/components/tool/RomAnalysisPanel";
import PatchAnalysisPanel from "@/components/tool/PatchAnalysisPanel";
import ValidationSummary from "@/components/tool/ValidationSummary";
import PatchHistoryPanel from "@/components/tool/PatchHistoryPanel";
import { Button } from "@/components/ui/Button";
import { IconAlertTriangle, IconCartridge, IconPatchFile } from "@/components/ui/icons";
import { useRomPatcherEngine, type PatchResult } from "@/hooks/useRomPatcherEngine";
import { useFileAnalysis } from "@/hooks/useFileAnalysis";
import { addHistoryEntry } from "@/lib/patch-history";

const BUTTON_LABELS: Record<string, string> = {
  "reading-rom": "Reading ROM…",
  "reading-patch": "Reading patch…",
  validating: "Validating…",
  patching: "Applying patch…",
  "verifying-output": "Verifying output…",
  "preparing-download": "Preparing download…",
};

const PROCESSING_STAGES = new Set([
  "reading-rom",
  "reading-patch",
  "validating",
  "patching",
  "verifying-output",
  "preparing-download",
]);

export default function RomPatcherTool() {
  const [romFile, setRomFile] = useState<File | null>(null);
  const [patchFile, setPatchFile] = useState<File | null>(null);
  const [format, setFormat] = useState<PatchFormat>(PATCH_FORMATS[0]);
  const { stage, progress, error, result, runPatch, reset } = useRomPatcherEngine();
  const {
    romAnalysis,
    romStatus,
    romProgress,
    romError,
    patchAnalysis,
    patchStatus,
    patchProgress,
    patchError,
    analyzeRom,
    analyzePatch,
    clearRom,
    clearPatch,
  } = useFileAnalysis();

  const hasBothFiles = Boolean(romFile && patchFile);
  const isProcessing = PROCESSING_STAGES.has(stage);
  const isKnownUnrecognized = patchStatus === "done" && patchAnalysis !== null && !patchAnalysis.recognized;

  const historyWrittenRef = useRef<PatchResult | null>(null);
  useEffect(() => {
    if (
      stage === "done" &&
      result &&
      historyWrittenRef.current !== result &&
      romFile &&
      patchFile
    ) {
      addHistoryEntry({
        romFileName: romFile.name,
        patchFileName: patchFile.name,
        format: patchAnalysis?.format ?? "Unknown",
        outputFileName: result.fileName,
      });
      historyWrittenRef.current = result;
    }
  }, [stage, result, romFile, patchFile, patchAnalysis]);

  function handleRomSelected(file: File | null) {
    setRomFile(file);
    reset();
    // Drop any reference to the previous run's (potentially very large)
    // patched Blob now that it's no longer reachable via engine state —
    // otherwise this ref alone would keep it from being garbage collected.
    historyWrittenRef.current = null;
    if (file) {
      analyzeRom(file);
    } else {
      clearRom();
    }
  }

  function handlePatchSelected(file: File | null) {
    setPatchFile(file);
    reset();
    historyWrittenRef.current = null;
    if (file) {
      analyzePatch(file);
    } else {
      clearPatch();
    }
  }

  function handleApplyPatch() {
    if (!romFile || !patchFile || isProcessing) return;
    runPatch(romFile, patchFile, { romCrc32: romAnalysis?.crc32 });
  }

  return (
    <>
      <div className="glow-border rounded-2xl">
        <div className="card flex flex-col gap-6 rounded-2xl p-5 shadow-2xl shadow-black/20 sm:p-7">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent-green/20 to-accent-blue/20 text-accent-green">
              <IconCartridge className="h-5 w-5" />
            </span>
            <h2 className="text-lg font-semibold text-foreground">Patch a ROM</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-2">
              <FileDropZone
                label="Original ROM file"
                hint="Select the original ROM file from your device"
                icon={<IconCartridge />}
                file={romFile}
                onFileSelected={handleRomSelected}
              />
              <RomAnalysisPanel
                analysis={romAnalysis}
                status={romStatus}
                progress={romProgress}
                error={romError}
              />
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <FileDropZone
                label="Patch file"
                hint="Supports .ips, .ups, .bps, .xdelta and more"
                icon={<IconPatchFile />}
                file={patchFile}
                onFileSelected={handlePatchSelected}
              />
              <PatchAnalysisPanel
                analysis={patchAnalysis}
                status={patchStatus}
                progress={patchProgress}
                error={patchError}
              />
            </div>
          </div>

          <FormatSelector value={format} onChange={setFormat} />

          <ValidationSummary romAnalysis={romAnalysis} patchAnalysis={patchAnalysis} />

          <PatchProgress stage={stage} progress={progress} />

          {stage === "error" && error && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              <IconAlertTriangle className="h-5 w-5 flex-none text-amber-400" />
              <p>{error}</p>
            </div>
          )}

          <Button
            type="button"
            disabled={!hasBothFiles || isProcessing || isKnownUnrecognized}
            fullWidth
            title={isKnownUnrecognized ? "This patch file's format wasn't recognized" : undefined}
            onClick={handleApplyPatch}
          >
            {BUTTON_LABELS[stage] ?? "Apply Patch"}
          </Button>

          <DownloadResult result={result} />
        </div>
      </div>

      <PatchHistoryPanel />
    </>
  );
}
