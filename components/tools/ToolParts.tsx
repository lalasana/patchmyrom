"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { IconAlertTriangle, IconCopy, IconInfo, IconShieldCheck } from "@/components/ui/icons";
import { formatBytes } from "@/lib/format-bytes";
import type { PlatformInfo } from "@/lib/rom-toolkit";
import type { SessionError } from "@/lib/worker-session";

/** Window chrome shared by the toolkit tools (same look as the patcher). */
export function ToolWindow({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="retro-window">
      <div aria-hidden className="retro-titlebar">
        <span className="retro-dot bg-rose-400" />
        <span className="retro-dot bg-amber-300" />
        <span className="retro-dot bg-accent-green" />
        <span className="ml-2 h-1 flex-1 rounded-full bg-gradient-to-r from-accent-green/40 via-accent-blue/30 to-transparent" />
      </div>
      <div className="flex flex-col gap-6 p-5 sm:p-7">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
        {children}
      </div>
    </div>
  );
}

/**
 * One screen-reader announcement slot per tool. It is always in the page (a live region that is added together with
 * its text is often not announced) and its text only changes when there is something new to say, so progress is read
 * out at 25% steps and the result once, instead of the whole result being read again at every update.
 */
export function StatusAnnouncer({ message }: { message: string }) {
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}

/**
 * A failed job. When the likely fix is reloading the page (a worker file that no longer exists after an update, a blocked
 * worker) the button for it is shown first, so the person isn't left retrying something that can't work.
 */
export function ErrorNotice({ error, onRetry }: { error: SessionError; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
      <IconAlertTriangle className="mt-0.5 h-5 w-5 flex-none text-amber-300" />
      <div className="flex min-w-0 flex-col gap-2">
        <p className="break-words">{error.message}</p>
        {(error.suggestReload || onRetry) && (
          <div className="flex flex-wrap gap-2">
            {error.suggestReload && (
              <Button type="button" variant="secondary" className="min-h-9 px-3 py-1.5 text-xs" onClick={() => window.location.reload()}>
                Reload page
              </Button>
            )}
            {onRetry && (
              <Button type="button" variant="outline" className="min-h-9 px-3 py-1.5 text-xs" onClick={onRetry}>
                Try again
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function ProgressBar({ label, loaded, total }: { label: string; loaded: number; total: number }) {
  const percent = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : null;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent ?? undefined}
      className="flex flex-col gap-2.5 rounded-xl border border-accent-green/30 bg-accent-green/5 px-4 py-3.5 shadow-[0_0_30px_-14px_rgba(57,224,127,0.6)]"
    >
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-background/70 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]">
        <div
          className="progress-stripes h-full rounded-full bg-gradient-to-r from-accent-green to-accent-blue transition-all"
          style={{ width: `${percent ?? 15}%` }}
        />
      </div>
      <p className="text-xs font-medium text-foreground/80">
        {label}
        {percent !== null ? ` ${percent}% (${formatBytes(loaded)} / ${formatBytes(total)})` : ""}
      </p>
    </div>
  );
}

/** Copies text to the clipboard and shows a brief confirmation. */
export function CopyButton({ text, label, children, className = "" }: { text: string; label: string; children?: ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be unavailable or denied; the text is still selectable on screen.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-card/60 px-3 text-xs font-semibold text-muted transition-colors hover:border-accent-blue/50 hover:text-accent-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue ${className}`}
    >
      {copied ? <span className="text-accent-green">Copied ✓</span> : children ?? <IconCopy className="h-3.5 w-3.5" />}
    </button>
  );
}

const CONFIDENCE_STYLES = {
  confirmed: { label: "Confirmed from header", classes: "border-accent-green/40 bg-accent-green/10 text-accent-green" },
  "extension-only": { label: "From file extension only", classes: "border-amber-400/40 bg-amber-500/10 text-amber-300" },
  unknown: { label: "Not recognised", classes: "border-border bg-card/60 text-muted" },
} as const;

/** Platform + how sure we are, with the evidence one click away — never states a guess as a fact. */
export function PlatformSummary({ platform }: { platform: PlatformInfo }) {
  const style = CONFIDENCE_STYLES[platform.confidence];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-base font-bold text-foreground">{platform.platform ?? "Unknown platform"}</span>
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${style.classes}`}>{style.label}</span>
      </div>
      {platform.evidence.length > 0 && (
        <ul className="list-disc space-y-0.5 pl-5 text-xs text-muted marker:text-accent-green">
          {platform.evidence.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      {platform.notes.map((note) => (
        <p key={note} className="flex items-start gap-2 text-xs text-amber-200">
          <IconInfo className="mt-0.5 h-3.5 w-3.5 flex-none text-amber-300" />
          <span>{note}</span>
        </p>
      ))}
      {platform.confidence === "unknown" && (
        <p className="text-xs text-muted">
          No known console header or file extension matched. The checksums below are still correct — they describe the file whatever it is.
        </p>
      )}
    </div>
  );
}

export function StatusIcon({ status }: { status: "ok" | "bad" | "info" }) {
  if (status === "ok") return <IconShieldCheck className="h-4 w-4 flex-none text-accent-green" />;
  if (status === "bad") return <IconAlertTriangle className="h-4 w-4 flex-none text-rose-300" />;
  return <IconInfo className="h-4 w-4 flex-none text-accent-blue" />;
}
