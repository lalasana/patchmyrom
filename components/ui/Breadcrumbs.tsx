import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";
import { siteConfig } from "@/lib/site";

export type Crumb = {
  href: string;
  label: string;
};

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const allItems: Crumb[] = [{ href: "/", label: "Home" }, ...items];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: allItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: `${siteConfig.url}${item.href}`,
    })),
  };

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted">
      <JsonLd data={jsonLd} />
      <ol className="flex flex-wrap items-center gap-1">
        {allItems.map((item, index) => (
          <li key={item.href} className="flex items-center gap-1">
            {index > 0 && <span className="text-border">/</span>}
            {index === allItems.length - 1 ? (
              <span className="text-foreground">{item.label}</span>
            ) : (
              <Link href={item.href} className="hover:text-accent-blue transition-colors">
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
