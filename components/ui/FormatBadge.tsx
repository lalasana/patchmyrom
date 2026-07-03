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
    <div className={`rounded-lg border px-3.5 py-3 ${meta.classes}`}>
      <span className="text-sm font-bold">{format}</span>
      <p className="mt-0.5 text-xs text-muted">{meta.description}</p>
    </div>
  );
}

export function FormatChip({ format }: { format: FormatKey }) {
  const meta = FORMAT_META[format];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.classes}`}
    >
      {format}
    </span>
  );
}
