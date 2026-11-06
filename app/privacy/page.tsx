import PageHero from "@/components/ui/PageHero";
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

      <PageHero art="shield" accent="green">
<h1 className="text-3xl font-bold text-foreground sm:text-4xl">Privacy Policy</h1>
      <p className="text-sm text-muted">Last updated: November 6, 2026</p>
      </PageHero>

      <section className="pixel-card flex flex-col gap-3 p-6 text-muted">
        <h2 className="border-l-4 border-accent-green pl-3 text-xl font-bold text-foreground">ROM and Patch Files</h2>
        <p>
          PatchMyROM does not upload, store, or transmit any ROM or patch file you select. All
          file processing happens locally in your browser using standard web File APIs.
        </p>
      </section>

      <section id="cookies" className="pixel-card flex scroll-mt-24 flex-col gap-3 p-6 text-muted">
        <h2 className="border-l-4 border-accent-green pl-3 text-xl font-bold text-foreground">Cookies</h2>
        <p>
          PatchMyROM and the Google services described below use cookies and similar technologies.
          The cookie notice on the site is an information notice: clicking &ldquo;Accept&rdquo; hides
          it and stores a small entry in your browser&rsquo;s local storage so it does not appear again.
          It does not switch any service on or off, and the Google services below run whether or not
          you click it.
        </p>
        <p>
          The site also keeps a short list of your recent patches (file names and format only) in
          local storage so you can see them again. It never leaves your device. You can clear it, and
          the notice entry, at any time by clearing this site&rsquo;s data in your browser.
        </p>
      </section>

      <section className="pixel-card flex flex-col gap-3 p-6 text-muted">
        <h2 className="border-l-4 border-accent-green pl-3 text-xl font-bold text-foreground">Analytics &amp; Advertising</h2>
        <p>
          Every page loads Google Tag Manager and Google Analytics to measure how the site is used,
          and Google AdSense, through which Google may show advertising. These services are operated
          by Google and may set cookies and collect information such as your IP address, browser and
          device details, and the pages you visit, as described in{" "}
          <a
            href="https://policies.google.com/technologies/cookies"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-blue hover:underline"
          >
            Google&rsquo;s cookie information
          </a>
          . You can control them with your browser&rsquo;s cookie settings, with{" "}
          <a
            href="https://adssettings.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-blue hover:underline"
          >
            Google&rsquo;s ad settings
          </a>
          , or by installing Google&rsquo;s{" "}
          <a
            href="https://tools.google.com/dlpage/gaoptout"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-blue hover:underline"
          >
            Analytics opt-out add-on
          </a>
          .
        </p>
        <p>
          Your ROM and patch files are never part of this: they are processed only in your browser and
          are not sent to Google or anyone else.
        </p>
      </section>

      <section className="pixel-card flex flex-col gap-3 p-6 text-muted">
        <h2 className="border-l-4 border-accent-green pl-3 text-xl font-bold text-foreground">Contact</h2>
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
