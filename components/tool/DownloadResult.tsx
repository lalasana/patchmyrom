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
    <div
      className={`relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl px-5 py-7 text-center ${
        result
          ? "result-ready border-2 border-accent-green/60 bg-gradient-to-br from-accent-green/15 via-card to-accent-blue/10"
          : "border-2 border-dashed border-border bg-background/40"
      }`}
    >
      <span
        className={`flex h-14 w-14 items-center justify-center rounded-2xl border shadow-[0_8px_20px_-8px_rgba(0,0,0,0.7)] ${
          result
            ? "border-accent-green/60 bg-gradient-to-br from-accent-green to-accent-blue text-background"
            : "border-border bg-card text-muted"
        }`}
      >
        <IconDownloadTray className="h-6 w-6" />
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
        className="min-h-12 px-8 text-base sm:w-auto"
        onClick={handleDownload}
      >
        Download Patched File
      </Button>

      {showEmulatorCta && !isAndroid && <GbaEmulatorCta placement="success" compact className="mt-1 w-full" />}
    </div>
  );
}
