import type { CardArtAccent } from "@/components/ui/CardArt";
import { PAGE_THEME } from "@/components/tool/page-theme";

export type Fact = { label: string; value: string; note: string };

/** Four at-a-glance facts that are specific to this console or patch format. */
export default function QuickFacts({ facts, accent, title }: { facts: Fact[]; accent: CardArtAccent; title: string }) {
  const theme = PAGE_THEME[accent];
  return (
    <section aria-label={title}>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {facts.map((fact) => (
          <div key={fact.label} className={`flex min-w-0 flex-col gap-1 rounded-xl border-2 px-4 py-3.5 ${theme.tile}`}>
            <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{fact.label}</dt>
            <dd className={`break-words text-lg font-extrabold leading-tight sm:text-xl ${theme.text}`}>{fact.value}</dd>
            <dd className="text-xs leading-snug text-muted">{fact.note}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
