"use client";

import type { CompatibilityCheck } from "@/lib/validate-compatibility";
import { IconAlertTriangle, IconInfo, IconShieldCheck } from "@/components/ui/icons";

type ValidationSummaryProps = {
  /** Result of checkCompatibility(); null until both files have been analyzed. */
  check: CompatibilityCheck | null;
  /** Id the Apply button points at via aria-describedby when the verdict blocks patching. */
  id?: string;
};

const LEVEL_STYLES = {
  ok: {
    classes: "border-accent-green/40 bg-gradient-to-r from-accent-green/15 to-accent-green/5 text-accent-green",
    icon: IconShieldCheck,
  },
  info: {
    classes: "border-accent-blue/40 bg-gradient-to-r from-accent-blue/15 to-accent-blue/5 text-foreground",
    icon: IconInfo,
  },
  warning: {
    classes: "border-amber-400/40 bg-gradient-to-r from-amber-500/15 to-amber-500/5 text-amber-200",
    icon: IconAlertTriangle,
  },
  unknown: {
    classes: "border-border bg-card/60 text-muted",
    icon: IconInfo,
  },
} as const;

export default function ValidationSummary({ check, id }: ValidationSummaryProps) {
  if (!check) return null;

  const { classes, icon: Icon } = LEVEL_STYLES[check.level];
  // Blocking verdicts are announced as alerts; the rest are quiet status text.
  const live = check.blocking ? { role: "alert" as const } : { role: "status" as const };

  return (
    <div id={id} {...live} className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm shadow-[0_10px_24px_-18px_rgba(0,0,0,0.9)] ${classes}`}>
      <Icon className="mt-0.5 h-5 w-5 flex-none" />
      <div className="min-w-0 flex-1">
        {check.blocking && <p className="font-semibold">{check.title}</p>}
        <p className={check.blocking ? "mt-1" : undefined}>{check.message}</p>
        {check.details.length > 0 && (
          <dl className="mt-2 grid gap-x-3 gap-y-1 text-xs sm:grid-cols-[auto_1fr]">
            {check.details.map((detail) => (
              <div key={detail.label} className="contents">
                <dt className="font-medium opacity-80">{detail.label}</dt>
                <dd className="min-w-0 break-words font-mono">{detail.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}
