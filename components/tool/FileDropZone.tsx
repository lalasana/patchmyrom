"use client";

import { useRef, useState, type DragEvent, type ReactNode } from "react";
import CardArt, { type CardArtName } from "@/components/ui/CardArt";
import { IconShieldCheck } from "@/components/ui/icons";
import { formatBytes } from "@/lib/format-bytes";

type FileDropZoneProps = {
  label: string;
  hint?: string;
  accept?: string;
  icon: ReactNode;
  file: File | null;
  onFileSelected: (file: File | null) => void;
  /** Decorative illustration shown while no file is selected. */
  art?: CardArtName;
};

export default function FileDropZone({
  label,
  hint,
  accept,
  icon,
  file,
  onFileSelected,
  art,
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) onFileSelected(dropped);
  }

  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-base font-bold tracking-tight text-foreground">{label}</span>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`dropzone group relative flex min-h-56 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
          isDragging
            ? "scale-[1.02] border-accent-blue bg-accent-blue/10 shadow-[0_0_40px_-8px_rgba(76,201,240,0.6)]"
            : file
              ? "border-solid border-accent-green/60 bg-gradient-to-br from-accent-green/15 via-accent-green/5 to-accent-blue/10 shadow-[0_0_36px_-14px_rgba(57,224,127,0.7)]"
              : "border-border bg-background/50 hover:border-accent-green/60 hover:bg-card-hover hover:shadow-[0_0_36px_-14px_rgba(57,224,127,0.55)]"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(event) => onFileSelected(event.target.files?.[0] ?? null)}
        />

        {/* corner brackets */}
        <span aria-hidden className="pointer-events-none absolute left-3 top-3 h-4 w-4 rounded-tl-md border-l-2 border-t-2 border-accent-green/60" />
        <span aria-hidden className="pointer-events-none absolute right-3 top-3 h-4 w-4 rounded-tr-md border-r-2 border-t-2 border-accent-blue/60" />
        <span aria-hidden className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 rounded-bl-md border-b-2 border-l-2 border-accent-blue/60" />
        <span aria-hidden className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 rounded-br-md border-b-2 border-r-2 border-accent-green/60" />

        {file ? (
          <>
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-accent-green/50 bg-accent-green/15 text-accent-green shadow-[0_8px_24px_-8px_rgba(57,224,127,0.7)]">
              <IconShieldCheck className="h-7 w-7" />
            </span>
            <span className="max-w-full truncate px-2 text-base font-bold text-accent-green">{file.name}</span>
            <span className="text-xs text-muted">{formatBytes(file.size)} — selected locally, not uploaded</span>
          </>
        ) : (
          <>
            {art ? (
              <CardArt name={art} accent="green" className="h-24 w-full max-w-[220px] rounded-xl border border-border/60" />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card text-muted shadow-[0_6px_16px_-6px_rgba(0,0,0,0.6)] transition-all group-hover:-translate-y-0.5 group-hover:border-accent-green/50 group-hover:text-accent-green">
                <span className="[&>svg]:h-6 [&>svg]:w-6">{icon}</span>
              </span>
            )}
            <span className="mt-1 text-sm font-semibold text-foreground">Drag &amp; drop, or click to browse</span>
            {hint && <span className="max-w-[16rem] text-xs text-muted">{hint}</span>}
          </>
        )}
      </div>
    </div>
  );
}
