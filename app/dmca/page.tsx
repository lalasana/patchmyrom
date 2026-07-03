import type { Metadata } from "next";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { siteConfig } from "@/lib/site";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "DMCA Policy",
  description: "PatchMyROM's DMCA takedown policy and contact process.",
  path: "/dmca",
});

export default function DmcaPage() {
  return (
    <div className="container-page flex flex-col gap-8 py-10 sm:py-14">
      <Breadcrumbs items={[{ href: "/dmca", label: "DMCA" }]} />

      <h1 className="text-3xl font-bold text-foreground sm:text-4xl">DMCA Policy</h1>

      <section className="flex flex-col gap-3 text-muted">
        <p>
          {siteConfig.name} respects the intellectual property rights of others. This site does
          not host or distribute copyrighted ROM files. If you believe content linked from or
          referenced on this site infringes your copyright, please contact us with the details
          below.
        </p>
      </section>

      <section className="flex flex-col gap-3 text-muted">
        <h2 className="text-xl font-semibold text-foreground">Filing a Notice</h2>
        <p>Please include the following information in your takedown request:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Identification of the copyrighted work claimed to be infringed.</li>
          <li>The specific URL or page on {siteConfig.domain} where the material is located.</li>
          <li>Your contact information (name, address, email, phone number).</li>
          <li>A statement that you have a good-faith belief the use is unauthorized.</li>
          <li>A statement, under penalty of perjury, that the information is accurate.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-3 text-muted">
        <h2 className="text-xl font-semibold text-foreground">Contact</h2>
        <p>
          Send DMCA notices to{" "}
          <a href={`mailto:${siteConfig.contactEmail}`} className="text-accent-blue hover:underline">
            {siteConfig.contactEmail}
          </a>
          .
        </p>
      </section>
    </div>
  );
}
