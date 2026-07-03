"use client";

import { IconAlertTriangle, IconDownloadTray, IconShieldCheck } from "@/components/ui/icons";
import { Button } from "@/components/ui/Button";
import type { PatchResult } from "@/hooks/useRomPatcherEngine";
import { formatBytes } from "@/lib/format-bytes";

type DownloadResultProps = {
  result: PatchResult | null;
};

export default function DownloadResult({ result }: DownloadResultProps) {
  function handleDownload() {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = result.fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/40 px-4 py-6 text-center">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-full ${
          result ? "bg-accent-green/15 text-accent-green" : "bg-border/40 text-muted"
        }`}
      >
        <IconDownloadTray className="h-5 w-5" />
      </span>
      <span className="max-w-sm text-sm text-muted">
        {result ? (
          <>
            <span className="font-medium text-foreground">{result.fileName}</span> (
            {formatBytes(result.blob.size)}) is ready — generated locally, never uploaded.
          </>
        ) : (
          "Your patched ROM will appear here as a local download — generated entirely in your browser, never uploaded."
        )}
      </span>

      {result && result.outputVerified === true && (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-green">
          <IconShieldCheck className="h-3.5 w-3.5" />
          Output verified against the patch&apos;s checksum
        </span>
      )}
      {result && result.outputVerified === false && (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-300">
          <IconAlertTriangle className="h-3.5 w-3.5" />
          Output checksum didn&apos;t match — double-check the file before using it
        </span>
      )}

      <Button
        type="button"
        disabled={!result}
        fullWidth={false}
        className="sm:w-auto"
        onClick={handleDownload}
      >
        Download Patched File
      </Button>
    </div>
  );
}
