import Link from "next/link";
import type { ReactNode } from "react";
import CardArt, { type CardArtName } from "@/components/ui/CardArt";
import { IconArrowRight } from "@/components/ui/icons";

export type TroubleshootingItem = {
  problem: string;
  solution: string;
};

type TroubleshootingCardProps = TroubleshootingItem & {
  icon?: ReactNode;
  href?: string;
  art?: CardArtName;
};

/** Pick a fitting illustration from the wording of the problem (purely decorative). */
function inferArt(problem: string): CardArtName {
  const text = problem.toLowerCase();
  if (/checksum|hash|crc|header/.test(text)) return "checksum";
  if (/white screen|black screen|crash|won'?t open|freez|blank/.test(text)) return "whitescreen";
  if (/wrong|match|base rom|version|region|revision|clean/.test(text)) return "wrongrom";
  if (/format|extension|unsupported|rejected|won'?t load|corrupt|\.(ips|ups|bps|xdelta)/.test(text)) return "unsupported";
  if (/size|output|download|large/.test(text)) return "download";
  return "warning";
}

export default function TroubleshootingCard({ problem, solution, href, art }: TroubleshootingCardProps) {
  const content = (
    <>
      <CardArt name={art ?? inferArt(problem)} accent="amber" className="h-28" />
      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <p className="text-lg font-bold leading-snug text-foreground">{problem}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{solution}</p>
        {href && (
          <span className="mt-auto inline-flex items-center gap-1 pt-4 text-xs font-semibold text-amber-300">
            Learn more
            <IconArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </span>
        )}
      </div>
    </>
  );

  const className = "pixel-card pixel-hover group flex flex-col overflow-hidden";

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
