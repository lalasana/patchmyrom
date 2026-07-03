import Link from "next/link";
import type { ReactNode } from "react";
import { IconArrowRight } from "@/components/ui/icons";

export type TroubleshootingItem = {
  problem: string;
  solution: string;
};

type TroubleshootingCardProps = TroubleshootingItem & {
  icon?: ReactNode;
  href?: string;
};

export default function TroubleshootingCard({ problem, solution, icon, href }: TroubleshootingCardProps) {
  const content = (
    <>
      {icon && (
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
          <span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span>
        </span>
      )}
      <p className="mt-3 font-medium text-foreground">{problem}</p>
      <p className="mt-1 text-sm text-muted">{solution}</p>
      {href && (
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-accent-blue">
          Learn more
          <IconArrowRight className="h-3.5 w-3.5" />
        </span>
      )}
    </>
  );

  const className =
    "flex flex-col rounded-xl border border-amber-500/20 bg-card px-4 py-4 transition-all hover:-translate-y-0.5 hover:border-amber-500/45 hover:shadow-lg hover:shadow-amber-500/5";

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
