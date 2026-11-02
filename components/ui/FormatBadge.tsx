export const FORMAT_KEYS = ["IPS", "UPS", "BPS", "XDelta", "APS", "PPF", "RUP"] as const;
export type FormatKey = (typeof FORMAT_KEYS)[number];

type FormatMeta = {
  description: string;
  classes: string;
};

const FORMAT_META: Record<FormatKey, FormatMeta> = {
  IPS: {
    description: "Classic byte-diff format",
    classes: "border-accent-green/30 bg-accent-green/10 text-accent-green",
  },
  UPS: {
    description: "Checksum-verified patches",
    classes: "border-accent-blue/30 bg-accent-blue/10 text-accent-blue",
  },
  BPS: {
    description: "Modern, Pokemon-hack favorite",
    classes: "border-purple-500/30 bg-purple-500/10 text-purple-300",
  },
  XDelta: {
    description: "Great for large ROMs",
    classes: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  },
  APS: {
    description: "GBA-focused patch format",
    classes: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  },
  PPF: {
    description: "Common for disc-based games",
    classes: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  },
  RUP: {
    description: "Universal format with patch notes",
    classes: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
  },
};

export function FormatBadge({ format }: { format: FormatKey }) {
  const meta = FORMAT_META[format];
  return (
    <div
      className={`group relative h-full overflow-hidden rounded-2xl border px-4 py-4 shadow-[0_14px_30px_-20px_rgba(0,0,0,0.9)] transition-colors ${meta.classes}`}
    >
      {/* decorative "diff" lines */}
      <svg
        aria-hidden
        viewBox="0 0 80 56"
        className="pointer-events-none absolute -right-2 -top-1 h-12 w-16 opacity-30 sm:h-16 sm:w-24 transition-opacity group-hover:opacity-60"
        fill="currentColor"
      >
        <rect x="4" y="6" width="8" height="8" rx="2" />
        <rect x="18" y="8" width="52" height="4" rx="2" />
        <rect x="4" y="22" width="8" height="8" rx="2" opacity="0.6" />
        <rect x="18" y="24" width="38" height="4" rx="2" opacity="0.6" />
        <rect x="4" y="38" width="8" height="8" rx="2" />
        <rect x="18" y="40" width="60" height="4" rx="2" />
      </svg>
      <span className="relative text-xl font-extrabold tracking-tight">{format}</span>
      <p className="relative mt-1 text-xs leading-relaxed text-muted">{meta.description}</p>
    </div>
  );
}

export function FormatChip({ format }: { format: FormatKey }) {
  const meta = FORMAT_META[format];
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-bold ${meta.classes}`}
    >
      {format}
    </span>
  );
}
