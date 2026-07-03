import type { Metadata } from "next";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { siteConfig } from "@/lib/site";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Privacy Policy",
  description: "PatchMyROM's privacy policy — what data we collect and how cookies are used.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="container-page flex flex-col gap-8 py-10 sm:py-14">
      <Breadcrumbs items={[{ href: "/privacy", label: "Privacy Policy" }]} />

      <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Privacy Policy</h1>
      <p className="text-sm text-muted">Last updated: July 2, 2026</p>

      <section className="flex flex-col gap-3 text-muted">
        <h2 className="text-xl font-semibold text-foreground">ROM and Patch Files</h2>
        <p>
          PatchMyROM does not upload, store, or transmit any ROM or patch file you select. All
          file processing happens locally in your browser using standard web File APIs.
        </p>
      </section>

      <section className="flex flex-col gap-3 text-muted">
        <h2 className="text-xl font-semibold text-foreground">Cookies</h2>
        <p>
          We use a small &ldquo;necessary&rdquo; cookie/local storage entry to remember your
          cookie preferences. Analytics and advertising cookies are only set if you explicitly
          opt in via the cookie consent banner or the &ldquo;Cookie Settings&rdquo; link in the
          footer. As of this version of the site, no analytics or advertising scripts are loaded
          regardless of your choice.
        </p>
      </section>

      <section className="flex flex-col gap-3 text-muted">
        <h2 className="text-xl font-semibold text-foreground">Analytics &amp; Advertising</h2>
        <p>
          When analytics or advertising are enabled in a future version of the site, this policy
          will be updated to disclose the specific providers used and what data they collect.
        </p>
      </section>

      <section className="flex flex-col gap-3 text-muted">
        <h2 className="text-xl font-semibold text-foreground">Contact</h2>
        <p>
          Questions about this policy can be sent to{" "}
          <a href={`mailto:${siteConfig.contactEmail}`} className="text-accent-blue hover:underline">
            {siteConfig.contactEmail}
          </a>
          .
        </p>
      </section>
    </div>
  );
}
