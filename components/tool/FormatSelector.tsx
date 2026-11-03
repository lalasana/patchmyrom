"use client";

export const PATCH_FORMATS = ["Auto-detect", "IPS", "UPS", "BPS", "xdelta"] as const;
export type PatchFormat = (typeof PATCH_FORMATS)[number];

type FormatSelectorProps = {
  value: PatchFormat;
  onChange: (value: PatchFormat) => void;
  /** Format actually detected in the patch file, when it differs from the chosen one. */
  mismatch?: string | null;
};

export default function FormatSelector({ value, onChange, mismatch = null }: FormatSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-2.5 text-base font-bold tracking-tight text-foreground">
        Patch format
        <div className="relative">
          <select
            value={value}
            onChange={(event) => onChange(event.target.value as PatchFormat)}
            className="w-full cursor-pointer appearance-none rounded-xl border-2 border-border bg-background/60 px-4 py-3 text-sm font-semibold text-foreground shadow-[inset_0_2px_0_0_rgba(0,0,0,0.25)] transition-all hover:border-accent-green/50 focus:border-accent-green focus:outline-none focus:ring-2 focus:ring-accent-green/30"
          >
            {PATCH_FORMATS.map((format) => (
              <option key={format} value={format} className="bg-card">
                {format}
              </option>
            ))}
          </select>
          <span
            aria-hidden
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-accent-green"
          >
            ▾
          </span>
        </div>
      </label>
      <p className="text-xs text-muted">
        The format is always read from the patch file itself, so Auto-detect is safe for any file. Choosing one here
        only flags a file that turns out to be something else.
      </p>
      {mismatch && (
        <p
          role="status"
          className="rounded-lg border border-accent-blue/40 bg-accent-blue/10 px-3 py-2 text-xs text-foreground"
        >
          This file is {/^(IPS|xdelta|APS)/.test(mismatch) ? "an" : "a"} <strong>{mismatch}</strong> patch, not {value}. It will be applied as {mismatch}.
        </p>
      )}
    </div>
  );
}
