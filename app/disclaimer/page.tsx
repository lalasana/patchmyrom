import type { Metadata } from "next";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { siteConfig } from "@/lib/site";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Disclaimer",
  description: "PatchMyROM's disclaimer regarding ROM ownership and copyrighted content.",
  path: "/disclaimer",
});

export default function DisclaimerPage() {
  return (
    <div className="container-page flex flex-col gap-8 py-10 sm:py-14">
      <Breadcrumbs items={[{ href: "/disclaimer", label: "Disclaimer" }]} />

      <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Disclaimer</h1>

      <section className="flex flex-col gap-3 text-muted">
        <h2 className="text-xl font-semibold text-foreground">No ROM Files Provided</h2>
        <p>
          {siteConfig.name} does not host, distribute, link to, or provide copyrighted ROM files
          of any kind. This site is a patching tool only — it applies a patch file you provide to
          a ROM file you provide.
        </p>
      </section>

      <section className="flex flex-col gap-3 text-muted">
        <h2 className="text-xl font-semibold text-foreground">Your Responsibility</h2>
        <p>
          You are solely responsible for ensuring that any ROM file you use with this tool is a
          legally-obtained backup of a game you own. Using this tool with ROM files you do not
          have the legal right to use may violate copyright law in your jurisdiction.
        </p>
      </section>

      <section className="flex flex-col gap-3 text-muted">
        <h2 className="text-xl font-semibold text-foreground">Third-Party Patches</h2>
        <p>
          ROM hack patches referenced or linked from this site are created by independent, third
          party communities and creators. {siteConfig.name} is not affiliated with, and does not
          endorse, any specific ROM hack unless explicitly stated.
        </p>
      </section>
    </div>
  );
}
