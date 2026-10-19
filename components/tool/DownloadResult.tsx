"use client";

import { IconAlertTriangle, IconDownloadTray, IconInfo, IconShieldCheck } from "@/components/ui/icons";
import { describeVerification } from "@/lib/output-verification";
import { Button } from "@/components/ui/Button";
import GbaEmulatorCta from "@/components/ui/GbaEmulatorCta";
import { useIsAndroid } from "@/lib/gba-emulator-client";
import { isGameBoyFamilyFile } from "@/lib/gba-emulator";
import type { PatchResult } from "@/hooks/useRomPatcherEngine";
import { formatBytes } from "@/lib/format-bytes";

type DownloadResultProps = {
  result: PatchResult | null;
};

export default function DownloadResult({ result }: DownloadResultProps) {
  const isAndroid = useIsAndroid();
  // Only offer the emulator for files it can play (.gba/.gbc/.gb) — never for .nds, .sfc, .nes, ...
  const showEmulatorCta = Boolean(result && isGameBoyFamilyFile(result.fileName));
  // What we may truthfully say about the output: verified / partly / not verifiable (see lib/output-verification.ts).
  const verification = result ? describeVerification(result.outputVerified, result.verification) : null;
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

      {verification && (
        <span
          role="status"
          className={`inline-flex max-w-sm items-start gap-1.5 text-xs ${
            verification.state === "verified"
              ? "font-medium text-accent-green"
              : verification.state === "unverified"
                ? "text-muted"
                : "font-medium text-amber-300"
          }`}
        >
          {verification.state === "verified" ? (
            <IconShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-none" />
          ) : verification.state === "unverified" ? (
            <IconInfo className="mt-0.5 h-3.5 w-3.5 flex-none" />
          ) : (
            <IconAlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none" />
          )}
          <span>{verification.label}</span>
        </span>
      )}

      {/* Android: recommendation sits above the download button; everyone else sees it below. */}
      {showEmulatorCta && isAndroid && <GbaEmulatorCta placement="success" compact className="mt-1 w-full" />}

      <Button
        type="button"
        disabled={!result}
        fullWidth={false}
        className="min-h-11 sm:w-auto"
        onClick={handleDownload}
      >
        Download Patched File
      </Button>

      {showEmulatorCta && !isAndroid && <GbaEmulatorCta placement="success" compact className="mt-1 w-full" />}
    </div>
  );
}
