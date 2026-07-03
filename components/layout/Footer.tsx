import Link from "next/link";
import { footerLinks, siteConfig } from "@/lib/site";
import CookieSettingsLink from "@/components/layout/CookieSettingsLink";

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-sm text-muted transition-colors hover:text-foreground"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container-page grid grid-cols-2 gap-8 py-10 sm:grid-cols-3 lg:grid-cols-6">
        <div className="col-span-2 flex flex-col gap-2 sm:col-span-3 lg:col-span-1">
          <span className="font-semibold text-foreground">{siteConfig.name}</span>
          <p className="text-sm text-muted">Patch ROM files locally in your browser.</p>
        </div>
        <FooterColumn title="Tool" links={footerLinks.tool} />
        <FooterColumn title="Formats" links={footerLinks.formats} />
        <FooterColumn title="Consoles" links={footerLinks.consoles} />
        <FooterColumn title="Guides" links={footerLinks.guides} />
        <FooterColumn title="Legal" links={footerLinks.legal} />
      </div>
      <div className="border-t border-border">
        <div className="container-page flex flex-col gap-2 py-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>
            &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </span>
          <CookieSettingsLink />
        </div>
      </div>
    </footer>
  );
}
