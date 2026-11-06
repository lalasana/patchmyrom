import type { CardArtAccent } from "@/components/ui/CardArt";
import { PAGE_THEME } from "@/components/tool/page-theme";

export type DiagramSegment = {
  label: string;
  sub?: string;
  /** Relative width. */
  grow?: number;
  /** accent = the page colour, ok / bad = verdict colours, muted = neutral. */
  tone?: "accent" | "ok" | "bad" | "muted";
};
export type DiagramRow = { label: string; segments: DiagramSegment[]; note?: string };
export type DiagramData = { title: string; caption: string; rows: DiagramRow[] };

const TONES = {
  ok: "border-accent-green/50 bg-accent-green/15 text-accent-green",
  bad: "border-rose-400/50 bg-rose-400/10 text-rose-300",
  muted: "border-border bg-background/60 text-foreground",
};

/**
 * Small explanatory diagram built from text segments (not an image), so it stays readable on phones,
 * scales with the layout and is fully accessible. Each row is a labelled strip of segments.
 */
export default function FormatDiagram({ title, caption, rows, accent }: DiagramData & { accent: CardArtAccent }) {
  const theme = PAGE_THEME[accent];
  return (
    <figure className="pixel-card flex flex-col gap-4 p-5">
      <figcaption className="flex flex-col gap-1">
        <span className={`text-sm font-bold uppercase tracking-[0.14em] ${theme.text}`}>{title}</span>
        <span className="text-sm leading-relaxed text-muted">{caption}</span>
      </figcaption>
      <div className="flex flex-col gap-4">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold text-muted">{row.label}</p>
            <div className="flex flex-wrap gap-1">
              {row.segments.map((seg) => (
                <div
                  key={seg.label}
                  style={{ flex: `${seg.grow ?? 1} 1 0%` }}
                  className={`flex min-w-[5.25rem] flex-col justify-center rounded-md border-2 px-1.5 py-1.5 text-center ${
                    seg.tone === "accent" ? theme.seg : TONES[seg.tone ?? "muted"]
                  }`}
                >
                  <span className="break-words text-[11px] font-bold leading-tight sm:text-xs">{seg.label}</span>
                  {seg.sub && <span className="mt-0.5 break-words text-[10px] font-medium leading-tight text-muted">{seg.sub}</span>}
                </div>
              ))}
            </div>
            {row.note && <p className="text-xs text-muted">{row.note}</p>}
          </div>
        ))}
      </div>
    </figure>
  );
}
