"use client";

export const PATCH_FORMATS = ["Auto-detect", "IPS", "UPS", "BPS", "xdelta"] as const;
export type PatchFormat = (typeof PATCH_FORMATS)[number];

type FormatSelectorProps = {
  value: PatchFormat;
  onChange: (value: PatchFormat) => void;
};

export default function FormatSelector({ value, onChange }: FormatSelectorProps) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
      Patch format
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value as PatchFormat)}
          className="w-full appearance-none rounded-lg border border-border bg-card/60 px-3 py-2.5 text-sm text-foreground transition-colors hover:border-accent-blue/40 focus:border-accent-blue focus:outline-none"
        >
          {PATCH_FORMATS.map((format) => (
            <option key={format} value={format} className="bg-card">
              {format}
            </option>
          ))}
        </select>
        <span
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
        >
          ▾
        </span>
      </div>
    </label>
  );
}
