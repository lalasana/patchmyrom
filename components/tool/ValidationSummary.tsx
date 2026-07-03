"use client";

import type { PatchAnalysis, RomAnalysis } from "@/hooks/useFileAnalysis";
import { checkCompatibility } from "@/lib/validate-compatibility";
import { IconAlertTriangle, IconInfo, IconShieldCheck } from "@/components/ui/icons";

type ValidationSummaryProps = {
  romAnalysis: RomAnalysis | null;
  patchAnalysis: PatchAnalysis | null;
};

const LEVEL_STYLES = {
  ok: {
    classes: "border-accent-green/30 bg-accent-green/10 text-accent-green",
    icon: IconShieldCheck,
  },
  warning: {
    classes: "border-amber-500/30 bg-amber-500/10 text-amber-200",
    icon: IconAlertTriangle,
  },
  unknown: {
    classes: "border-border bg-card/60 text-muted",
    icon: IconInfo,
  },
} as const;

export default function ValidationSummary({ romAnalysis, patchAnalysis }: ValidationSummaryProps) {
  const check = checkCompatibility(romAnalysis, patchAnalysis);
  if (!check) return null;

  const { classes, icon: Icon } = LEVEL_STYLES[check.level];

  return (
    <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${classes}`}>
      <Icon className="h-5 w-5 flex-none" />
      <p>{check.message}</p>
    </div>
  );
}
