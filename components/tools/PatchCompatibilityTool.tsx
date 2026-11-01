"use client";

import { useState } from "react";
import Link from "next/link";
import FileDropZone from "@/components/tool/FileDropZone";
import { Button } from "@/components/ui/Button";
import { IconAlertTriangle, IconArrowRight, IconBolt, IconCartridge, IconInfo, IconPatchFile, IconShieldCheck } from "@/components/ui/icons";
import { CopyButton, PlatformSummary, ProgressBar, StatusIcon, ToolWindow } from "@/components/tools/ToolParts";
import { useCompatCheck } from "@/hooks/useCompatCheck";
import { compatReportToPlainText, type CompatState } from "@/lib/rom-toolkit";

const STATE_STYLES: Record<CompatState, { badge: string; box: string; title: string; icon: typeof IconShieldCheck; label: string }> = {
  compatible: {
    label: "Compatible",
    badge: "border-accent-green/50 bg-accent-green/15 text-accent-green",
    box: "border-accent-green/50 bg-gradient-to-br from-accent-green/15 via-card to-accent-blue/10",
    title: "text-accent-green",
    icon: IconShieldCheck,
  },
  mismatch: {
    label: "Mismatch",
    badge: "border-rose-400/50 bg-rose-500/15 text-rose-200",
    box: "border-rose-400/50 bg-gradient-to-br from-rose-500/15 via-card to-amber-500/10",
    title: "text-rose-200",
    icon: IconAlertTriangle,
  },
  "cannot-verify": {
    label: "Cannot verify",
    badge: "border-amber-400/50 bg-amber-500/15 text-amber-200",
    box: "border-amber-400/50 bg-gradient-to-br from-amber-500/15 via-card to-accent-blue/10",
    title: "text-amber-200",
    icon: IconInfo,
  },
};

function Legend() {
  return (
    <ul className="grid gap-2 text-xs text-muted sm:grid-cols-3">
      {(Object.keys(STATE_STYLES) as CompatState[]).map((state) => (
        <li key={state} className="flex items-start gap-2 rounded-lg border border-border/70 bg-background/40 px-3 py-2">
          <span className={`mt-0.5 flex-none rounded-full border px-2 py-0.5 text-[11px] font-bold ${STATE_STYLES[state].badge}`}>{STATE_STYLES[state].label}</span>
          <span>
            {state === "compatible" && "A checksum stored in the patch was compared with your ROM and matched."}
            {state === "mismatch" && "The patch's own data shows this is not the ROM it was made for."}
            {state === "cannot-verify" && "The patch format stores nothing to compare. Nobody can prove a match in advance."}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function PatchCompatibilityTool() {
  const { status, progress, result, error, check, reset } = useCompatCheck();
  const [romFile, setRomFile] = useState<File | null>(null);
  const [patchFile, setPatchFile] = useState<File | null>(null);

  function pickRom(file: File | null) {
    setRomFile(file);
    reset();
  }
  function pickPatch(file: File | null) {
    setPatchFile(file);
    reset();
  }

  const busy = status === "checking";
  const report = result?.report ?? null;
  const style = report ? STATE_STYLES[report.state] : null;
  const StateIcon = style?.icon;
  const lanes = [
    { key: "patch" as const, label: "Reading patch…" },
    { key: "rom" as const, label: "Checking ROM…" },
  ];

  return (
    <ToolWindow title="Check a ROM against a patch">
      <Legend />

      <div className="relative grid gap-5 sm:grid-cols-2 sm:gap-8">
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-border bg-card text-xl font-bold text-accent-green shadow-[0_8px_20px_-6px_rgba(0,0,0,0.8)] sm:flex"
        >
          +
        </span>
        <FileDropZone
          label="Original ROM file"
          hint="The unmodified ROM you want to patch"
          icon={<IconCartridge />}
          art="cartridge"
          file={romFile}
          onFileSelected={pickRom}
        />
        <FileDropZone
          label="Patch file"
          hint="Supports .ips, .ups, .bps, .xdelta, .aps, .ppf, .rup and more"
          icon={<IconPatchFile />}
          art="patch"
          file={patchFile}
          onFileSelected={pickPatch}
        />
      </div>

      <Button type="button" className="min-h-14 text-base" fullWidth disabled={!romFile || !patchFile || busy} onClick={() => romFile && patchFile && check(romFile, patchFile)}>
        <IconBolt className="h-5 w-5" />
        {busy ? "Checking…" : "Check Compatibility"}
      </Button>

      {busy && (
        <div className="flex flex-col gap-3">
          {lanes.map(({ key, label }) => {
            const lane = progress[key];
            return lane ? <ProgressBar key={key} label={label} loaded={lane.loaded} total={lane.total} /> : null;
          })}
        </div>
      )}

      {status === "error" && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <IconAlertTriangle className="mt-0.5 h-5 w-5 flex-none text-amber-300" />
          <p className="min-w-0 break-words">{error}</p>
        </div>
      )}

      {status === "done" && result && report && style && StateIcon && (
        <div className="flex flex-col gap-5" aria-live="polite">
          <section className={`flex flex-col gap-3 rounded-2xl border-2 p-5 sm:p-6 ${style.box}`}>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold ${style.badge}`}>
                <StateIcon className="h-4 w-4" />
                {style.label}
              </span>
              {report.alreadyPatched && <span className="rounded-full border border-accent-blue/40 bg-accent-blue/10 px-3 py-1 text-xs font-semibold text-accent-blue">Already patched</span>}
            </div>
            <h3 className={`text-xl font-extrabold leading-snug sm:text-2xl ${style.title}`}>{report.headline}</h3>
            <p className="text-sm leading-relaxed text-foreground/90">{report.summary}</p>
            {report.verification && (
              <p className="rounded-lg border border-border/70 bg-background/40 px-3 py-2 text-xs text-muted">
                <span className="font-semibold text-foreground">How this was checked: </span>
                {report.verification}
              </p>
            )}
          </section>

          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-bold text-foreground">What we found</h3>
            <dl className="flex flex-col gap-2">
              {report.evidence.map((item) => (
                <div key={item.label} className="flex items-start gap-3 rounded-xl border border-border bg-background/50 px-4 py-2.5">
                  <StatusIcon status={item.status} />
                  <div className="min-w-0 flex-1">
                    <dt className="text-xs font-semibold text-muted">{item.label}</dt>
                    <dd className="break-words text-sm text-foreground">{item.value}</dd>
                  </div>
                </div>
              ))}
            </dl>
            <div className="rounded-xl border border-border bg-background/40 p-4">
              <PlatformSummary platform={result.rom.platform} />
            </div>
          </div>

          {report.findings.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-lg font-bold text-foreground">Things to know</h3>
              {report.findings.map((finding) => (
                <div
                  key={finding.title}
                  className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
                    finding.level === "warning" ? "border-amber-400/40 bg-amber-500/10 text-amber-100" : "border-accent-blue/40 bg-accent-blue/10 text-foreground"
                  }`}
                >
                  {finding.level === "warning" ? <IconAlertTriangle className="mt-0.5 h-5 w-5 flex-none text-amber-300" /> : <IconInfo className="mt-0.5 h-5 w-5 flex-none text-accent-blue" />}
                  <div>
                    <p className="font-semibold">{finding.title}</p>
                    <p className="mt-1 text-sm opacity-90">{finding.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-bold text-foreground">What to do next</h3>
            <ol className="flex flex-col gap-2">
              {report.steps.map((step, index) => (
                <li key={step} className="flex items-start gap-3 rounded-xl border border-border bg-background/50 px-4 py-3 text-sm text-muted">
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-lg bg-gradient-to-br from-accent-green to-accent-blue text-xs font-extrabold text-background">{index + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-border/60 pt-4 text-sm">
            <CopyButton text={compatReportToPlainText(report)} label="Copy this report" className="px-3">
              Copy report
            </CopyButton>
            {report.state === "compatible" && (
              <Link href="/" className="inline-flex items-center gap-1 font-semibold text-accent-green hover:underline">
                Open the patcher
                <IconArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
            <Link href="/rom-checksum-checker" className="inline-flex items-center gap-1 font-semibold text-accent-blue hover:underline">
              Check ROM checksums
              <IconArrowRight className="h-3.5 w-3.5" />
            </Link>
            {report.state !== "compatible" && result.rom.platform.family === "snes" && (
              <Link href="/snes-rom-patcher" className="inline-flex items-center gap-1 font-semibold text-accent-blue hover:underline">
                SNES headers explained
                <IconArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}
    </ToolWindow>
  );
}
