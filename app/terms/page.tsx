import type { Metadata } from "next";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { siteConfig } from "@/lib/site";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Terms of Use",
  description: "The terms that govern using PatchMyROM's browser-based ROM patcher, including your responsibilities and our liability limits.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <div className="container-page flex flex-col gap-8 py-10 sm:py-14">
      <Breadcrumbs items={[{ href: "/terms", label: "Terms of Use" }]} />

      <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Terms of Use</h1>
      <p className="text-sm text-muted">Last updated: July 2, 2026</p>

      <section className="flex flex-col gap-3 text-muted">
        <h2 className="text-xl font-semibold text-foreground">Acceptance of Terms</h2>
        <p>
          By using {siteConfig.name}, you agree to these terms. If you do not agree, please do
          not use the site.
        </p>
      </section>

      <section className="flex flex-col gap-3 text-muted">
        <h2 className="text-xl font-semibold text-foreground">Use of the Service</h2>
        <p>
          {siteConfig.name} provides a browser-based tool for applying patch files to ROM files
          you already legally own. You are solely responsible for ensuring you have the legal
          right to any ROM file you use with this tool.
        </p>
      </section>

      <section className="flex flex-col gap-3 text-muted">
        <h2 className="text-xl font-semibold text-foreground">No Warranty</h2>
        <p>
          The service is provided &ldquo;as is&rdquo; without warranties of any kind. We do not
          guarantee that patching will succeed or that patched files will function correctly.
        </p>
      </section>

      <section className="flex flex-col gap-3 text-muted">
        <h2 className="text-xl font-semibold text-foreground">Changes to These Terms</h2>
        <p>
          These terms may be updated as the site evolves. Continued use of the site after changes
          are posted constitutes acceptance of the updated terms.
        </p>
      </section>
    </div>
  );
}
