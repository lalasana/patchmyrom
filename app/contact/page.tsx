import type { Metadata } from "next";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { siteConfig } from "@/lib/site";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Contact",
  description: "Get in touch with the PatchMyROM team.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="container-page flex flex-col gap-8 py-10 sm:py-14">
      <Breadcrumbs items={[{ href: "/contact", label: "Contact" }]} />

      <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Contact</h1>

      <div className="card flex flex-col gap-3 px-5 py-5 text-muted">
        <p>
          {siteConfig.name} has no account system or backend, so the fastest way to reach us is
          by email.
        </p>
        <p>
          For general questions, bug reports, or feedback:{" "}
          <a href={`mailto:${siteConfig.contactEmail}`} className="text-accent-blue hover:underline">
            {siteConfig.contactEmail}
          </a>
        </p>
        <p>
          For copyright concerns, please use our{" "}
          <a href="/dmca" className="text-accent-blue hover:underline">
            DMCA policy
          </a>{" "}
          instead.
        </p>
      </div>
    </div>
  );
}
