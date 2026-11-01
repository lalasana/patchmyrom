import type { ReactNode } from "react";

export function TrustBadge({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs font-medium text-muted shadow-[0_2px_0_0_rgba(0,0,0,0.3)] backdrop-blur-sm transition-colors hover:border-accent-green/40">
      <span className="text-accent-green [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>
      {label}
    </span>
  );
}
