"use client";

import { useRef, useState, type DragEvent, type ReactNode } from "react";
import { formatBytes } from "@/lib/format-bytes";

type FileDropZoneProps = {
  label: string;
  hint?: string;
  accept?: string;
  icon: ReactNode;
  file: File | null;
  onFileSelected: (file: File | null) => void;
};

export default function FileDropZone({
  label,
  hint,
  accept,
  icon,
  file,
  onFileSelected,
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
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
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
        className={`group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-all ${
          isDragging
            ? "border-accent-blue bg-accent-blue/5"
            : file
              ? "border-accent-green/40 bg-accent-green/5"
              : "border-border bg-card/60 hover:border-accent-blue/50 hover:bg-card-hover"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(event) => onFileSelected(event.target.files?.[0] ?? null)}
        />
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
            file
              ? "bg-accent-green/15 text-accent-green"
              : "bg-border/40 text-muted group-hover:text-accent-blue"
          }`}
        >
          <span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span>
        </span>
        {file ? (
          <>
            <span className="max-w-full truncate font-medium text-accent-green">{file.name}</span>
            <span className="text-xs text-muted">{formatBytes(file.size)} — selected locally, not uploaded</span>
          </>
        ) : (
          <>
            <span className="text-sm text-foreground">Drag &amp; drop, or click to browse</span>
            {hint && <span className="text-xs text-muted">{hint}</span>}
          </>
        )}
      </div>
    </div>
  );
}
