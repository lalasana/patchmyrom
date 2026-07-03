"use client";

import { useEffect, useRef, useState } from "react";
import type { AnalysisProgressInfo, AnalysisStatus, RomAnalysis } from "@/hooks/useFileAnalysis";
import { IconAlertTriangle, IconChevronDown, IconCopy, IconDatabase } from "@/components/ui/icons";
import { formatBytes } from "@/lib/format-bytes";

type RomAnalysisPanelProps = {
  analysis: RomAnalysis | null;
  status: AnalysisStatus;
  progress: AnalysisProgressInfo | null;
  error: string | null;
};

const HASH_LABELS: Array<{ key: "crc32" | "md5" | "sha1" | "sha256"; label: string }> = [
  { key: "crc32", label: "CRC32" },
  { key: "md5", label: "MD5" },
  { key: "sha1", label: "SHA-1" },
  { key: "sha256", label: "SHA-256" },
];

function HashRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can be unavailable/denied — fail silently, non-critical.
    }
  }

  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="w-16 flex-none font-medium text-muted">{label}</span>
      <code className="min-w-0 flex-1 truncate text-foreground">{value}</code>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Copy ${label} hash`}
        className="flex h-6 w-6 flex-none items-center justify-center rounded text-muted transition-colors hover:bg-card-hover hover:text-accent-blue"
      >
        {copied ? <span className="text-[10px] text-accent-green">✓</span> : <IconCopy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

export default function RomAnalysisPanel({ analysis, status, progress, error }: RomAnalysisPanelProps) {
  const [showHashes, setShowHashes] = useState(false);

  if (status === "idle") return null;

  if (status === "analyzing") {
    const percent = progress && progress.total > 0 ? Math.round((progress.loaded / progress.total) * 100) : null;
    return (
      <p className="text-xs text-muted">
        Analyzing ROM…{percent !== null ? ` ${percent}%` : ""}
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

  return (
    <div className="rounded-lg border border-border bg-card/40 px-3 py-2.5 text-xs">
      <div className="flex items-center gap-2 text-muted">
        <IconDatabase className="h-3.5 w-3.5 flex-none text-accent-blue" />
        <span className="text-foreground">{analysis.platform ?? "Unknown platform"}</span>
        <span aria-hidden>·</span>
        <span>{formatBytes(analysis.fileSize)}</span>
        <span aria-hidden>·</span>
        <span className="uppercase">{analysis.extension || "?"}</span>
      </div>
      <p className="mt-0.5 text-[11px] text-muted/70">
        Platform {analysis.detectionMethod === "extension+magic" ? "confirmed from file header" : "detected from file extension"}
      </p>

      <button
        type="button"
        onClick={() => setShowHashes((prev) => !prev)}
        aria-expanded={showHashes}
        className="mt-2 flex items-center gap-1 text-[11px] font-medium text-accent-blue"
      >
        <IconChevronDown className={`h-3 w-3 transition-transform ${showHashes ? "rotate-180" : ""}`} />
        {showHashes ? "Hide hash details" : "Show hash details"}
      </button>

      {showHashes && (
        <div className="mt-2 flex flex-col gap-1.5 border-t border-border/60 pt-2">
          {HASH_LABELS.map(({ key, label }) => (
            <HashRow key={key} label={label} value={analysis[key]} />
          ))}
        </div>
      )}
    </div>
  );
}
