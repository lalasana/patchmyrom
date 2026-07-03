import type { ReactNode } from "react";

export type SectionAccent = "green" | "blue" | "purple" | "amber";

const accentClasses: Record<SectionAccent, string> = {
  green: "bg-accent-green/15 text-accent-green",
  blue: "bg-accent-blue/15 text-accent-blue",
  purple: "bg-purple-500/15 text-purple-300",
  amber: "bg-amber-500/15 text-amber-400",
};

type SectionHeadingProps = {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  accent?: SectionAccent;
};

export default function SectionHeading({ icon, title, subtitle, accent = "blue" }: SectionHeadingProps) {
  return (
    <div className="flex items-center gap-3">
      <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ${accentClasses[accent]}`}>
        <span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span>
      </span>
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
    </div>
  );
}
