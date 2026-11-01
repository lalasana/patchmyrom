"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import FileDropZone from "@/components/tool/FileDropZone";
import { Button } from "@/components/ui/Button";
import { IconAlertTriangle, IconArrowRight, IconCartridge, IconShieldCheck } from "@/components/ui/icons";
import { CopyButton, PlatformSummary, ProgressBar, ToolWindow } from "@/components/tools/ToolParts";
import { useRomHashes } from "@/hooks/useRomHashes";
import { formatBytes } from "@/lib/format-bytes";
import {
  HASH_ALGORITHMS,
  HASH_ORDER,
  compareChecksums,
  parseExpectedChecksums,
  type HashAlgorithm,
  type RomHashes,
} from "@/lib/rom-toolkit";

function groupDigits(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function HashRow({ algorithm, value, uppercase, matched }: { algorithm: HashAlgorithm; value: string; uppercase: boolean; matched: boolean | null }) {
  const shown = uppercase ? value.toUpperCase() : value;
  return (
    <div
      className={`flex flex-col gap-1.5 rounded-xl border bg-background/50 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 ${
        matched === true ? "border-accent-green/60" : matched === false ? "border-rose-400/50" : "border-border"
      }`}
    >
      <span className="flex w-24 flex-none items-center gap-1.5 text-sm font-bold text-foreground">
        {HASH_ALGORITHMS[algorithm].label}
        {matched === true && (
          <>
            <IconShieldCheck className="h-4 w-4 text-accent-green" />
            <span className="sr-only">matches</span>
          </>
        )}
        {matched === false && (
          <>
            <IconAlertTriangle className="h-4 w-4 text-rose-300" />
            <span className="sr-only">does not match</span>
          </>
        )}
      </span>
      <code className="min-w-0 flex-1 break-all font-mono text-sm text-accent-blue">{shown}</code>
      <CopyButton text={shown} label={`Copy ${HASH_ALGORITHMS[algorithm].label}`} className="self-start px-3 sm:self-auto" />
    </div>
  );
}

function ComparisonBanner({ hashes, expectedText }: { hashes: RomHashes | null; expectedText: string }) {
  const parsed = useMemo(() => (expectedText.trim() ? parseExpectedChecksums(expectedText) : null), [expectedText]);

  if (!parsed) {
    return <p className="text-xs text-muted">Optional: paste a checksum from a ROM database or a patch&apos;s readme to see whether your file is identical to it.</p>;
  }
  if (!parsed.ok) {
    return (
      <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
        <IconAlertTriangle className="mt-0.5 h-4 w-4 flex-none text-amber-300" />
        <p>{parsed.message}</p>
      </div>
    );
  }
  if (!hashes) {
    return <p className="text-xs text-muted">Checksum understood ({parsed.items.map((i) => HASH_ALGORITHMS[i.algorithm].label).join(", ")}). Select a file to compare.</p>;
  }

  const comparison = compareChecksums(hashes, parsed.items);
  const match = comparison.overall === "match";
  return (
    <div
      role="status"
      className={`flex flex-col gap-3 rounded-xl border px-4 py-4 text-sm ${
        match ? "border-accent-green/50 bg-gradient-to-r from-accent-green/15 to-accent-green/5" : "border-rose-400/50 bg-gradient-to-r from-rose-500/15 to-rose-500/5"
      }`}
    >
      <p className={`flex items-center gap-2 text-base font-bold ${match ? "text-accent-green" : "text-rose-200"}`}>
        {match ? <IconShieldCheck className="h-5 w-5" /> : <IconAlertTriangle className="h-5 w-5" />}
        {match ? "Match — your file has exactly this checksum" : "No match — your file has a different checksum"}
      </p>
      <ul className="flex flex-col gap-1.5">
        {comparison.results.map((r) => (
          <li key={r.algorithm} className="flex flex-col gap-0.5 text-xs">
            <span className="font-semibold text-foreground">
              {r.label}: {r.match ? "matches" : "differs"}
            </span>
            {!r.match && (
              <span className="break-all font-mono text-muted">
                yours {r.actual} · expected {r.expected}
              </span>
            )}
          </li>
        ))}
      </ul>
      {match ? (
        <p className="text-xs text-foreground/80">
          This identifies the file; it is not a statement about the game&apos;s legal status, and a matching checksum only proves the file is identical to the one that checksum was taken from.
        </p>
      ) : (
        <div className="text-xs text-foreground/80">
          <p className="font-semibold">Common reasons:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            <li>A different region or revision of the same game (USA vs Europe, v1.0 vs v1.1).</li>
            <li>A ROM that was already patched, trimmed, padded or translated.</li>
            <li>A copier header (for example 512 bytes at the start of a SNES ROM) that the reference checksum does not include.</li>
            <li>An incomplete or corrupted download. Download it again.</li>
            <li>The checksum belongs to a different algorithm than you think. Paste it with its label (for example “SHA-1: …”).</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default function RomChecksumTool() {
  const { status, progress, result, error, hashFile, reset } = useRomHashes();
  const [file, setFile] = useState<File | null>(null);
  const [expectedText, setExpectedText] = useState("");
  const [uppercase, setUppercase] = useState(false);

  function handleFile(next: File | null) {
    setFile(next);
    if (next) hashFile(next);
    else reset();
  }

  const parsed = useMemo(() => (expectedText.trim() ? parseExpectedChecksums(expectedText) : null), [expectedText]);
  const comparison = useMemo(() => (result && parsed && parsed.ok ? compareChecksums(result.hashes, parsed.items) : null), [result, parsed]);
  const matchFor = (algorithm: HashAlgorithm): boolean | null => comparison?.results.find((r) => r.algorithm === algorithm)?.match ?? null;

  const allText = result
    ? [
        `File: ${result.fileName}`,
        `Size: ${groupDigits(result.fileSize)} bytes (${formatBytes(result.fileSize)})`,
        `Platform: ${result.platform.platform ?? "unknown"} (${result.platform.confidence})`,
        ...HASH_ORDER.map((a) => `${HASH_ALGORITHMS[a].label}: ${uppercase ? result.hashes[a].toUpperCase() : result.hashes[a]}`),
        "",
        "Calculated locally in the browser with PatchMyROM — the file was not uploaded.",
      ].join("\n")
    : "";

  return (
    <ToolWindow title="Check a ROM file">
      <FileDropZone
        label="ROM or game file"
        hint="Any ROM works — it is read on this device and never uploaded"
        icon={<IconCartridge />}
        art="cartridge"
        file={file}
        onFileSelected={handleFile}
      />

      {status === "hashing" && progress && (
        <div className="flex flex-col gap-2">
          <ProgressBar label="Calculating checksums…" loaded={progress.loaded} total={progress.total} />
          <div>
            <Button type="button" variant="outline" className="min-h-10 px-4 py-2 text-xs" onClick={() => handleFile(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {status === "error" && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <IconAlertTriangle className="mt-0.5 h-5 w-5 flex-none text-amber-300" />
          <div className="flex flex-col gap-2">
            <p>{error}</p>
            {file && (
              <div>
                <Button type="button" variant="outline" className="min-h-9 px-3 py-1.5 text-xs" onClick={() => hashFile(file)}>
                  Try again
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {status === "done" && result && (
        <div className="flex flex-col gap-5" aria-live="polite">
          <div className="grid gap-4 rounded-xl border border-border bg-background/40 p-4 sm:grid-cols-[1fr_auto] sm:items-start">
            <div className="flex min-w-0 flex-col gap-3">
              <div>
                <p className="truncate text-lg font-bold text-foreground" title={result.fileName}>
                  {result.fileName}
                </p>
                <p className="text-sm text-muted">
                  {formatBytes(result.fileSize)} · {groupDigits(result.fileSize)} bytes
                  {result.fileSize === 0 && " — this file is empty"}
                </p>
              </div>
              <PlatformSummary platform={result.platform} />
            </div>
            <p className="text-xs text-muted sm:text-right">Calculated in {(result.elapsedMs / 1000).toFixed(1)} s</p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-foreground">Checksums</h3>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
                  <input type="checkbox" checked={uppercase} onChange={(e) => setUppercase(e.target.checked)} className="h-4 w-4 accent-[#39e07f]" />
                  UPPERCASE
                </label>
                <CopyButton text={allText} label="Copy all checksums" className="px-3">
                  Copy all
                </CopyButton>
              </div>
            </div>
            {HASH_ORDER.map((a) => (
              <HashRow key={a} algorithm={a} value={result.hashes[a]} uppercase={uppercase} matched={matchFor(a)} />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <label htmlFor="expected-checksum" className="text-base font-bold tracking-tight text-foreground">
          Compare with an expected checksum
        </label>
        <textarea
          id="expected-checksum"
          value={expectedText}
          onChange={(e) => setExpectedText(e.target.value)}
          rows={3}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          placeholder={"Paste CRC32, MD5, SHA-1 or SHA-256\ne.g. SHA-1: da39a3ee5e6b4b0d3255bfef95601890afd80709"}
          aria-describedby="expected-help"
          className="w-full resize-y rounded-xl border-2 border-border bg-background/60 px-4 py-3 font-mono text-sm text-foreground shadow-[inset_0_2px_0_0_rgba(0,0,0,0.25)] placeholder:text-muted/60 hover:border-accent-green/50 focus:border-accent-green focus:outline-none focus:ring-2 focus:ring-accent-green/30"
        />
        <p id="expected-help" className="text-xs text-muted">
          The algorithm is detected from the length (8 = CRC32, 32 = MD5, 40 = SHA-1, 64 = SHA-256) or from a label. You can paste several, one per line.
        </p>
        <ComparisonBanner hashes={result?.hashes ?? null} expectedText={expectedText} />
      </div>

      {status === "done" && (
        <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-border/60 pt-4 text-sm">
          <Link href="/patch-compatibility-checker" className="inline-flex items-center gap-1 font-semibold text-accent-blue hover:underline">
            Check this ROM against a patch
            <IconArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link href="/" className="inline-flex items-center gap-1 font-semibold text-accent-blue hover:underline">
            Open the ROM patcher
            <IconArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </ToolWindow>
  );
}
