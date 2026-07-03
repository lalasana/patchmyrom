import Link from "next/link";
import { IconArrowRight } from "@/components/ui/icons";

export type RelatedGuide = {
  href: string;
  title: string;
  description: string;
};

export default function RelatedGuides({ items }: { items: RelatedGuide[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="card group flex flex-col gap-1 rounded-xl px-4 py-4 transition-all hover:-translate-y-0.5 hover:border-accent-blue/40 hover:shadow-lg hover:shadow-accent-blue/5"
        >
          <span className="flex items-center justify-between gap-2 font-medium text-foreground">
            {item.title}
            <IconArrowRight className="h-4 w-4 flex-none text-accent-blue opacity-0 transition-opacity group-hover:opacity-100" />
          </span>
          <span className="text-sm text-muted">{item.description}</span>
        </Link>
      ))}
    </div>
  );
}
