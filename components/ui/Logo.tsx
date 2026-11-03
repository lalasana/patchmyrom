import Image from "next/image";
import { siteConfig } from "@/lib/site";

// 480x120 rendition of the 960x240 brand wordmark (siteConfig.logo): it is only ever shown ~160px wide.
const LOGO_SRC = "/brand/patchmyrom-logo-480.webp";
const LOGO_WIDTH = 480;
const LOGO_HEIGHT = 120;

/** PatchMyROM wordmark (brand artwork). The alt text is the brand name, so the home link keeps its accessible name. */
export default function Logo({ className = "h-10 w-auto" }: { className?: string }) {
  return (
    <Image
      src={LOGO_SRC}
      alt={siteConfig.name}
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      priority
      className={`${className} drop-shadow-[0_2px_12px_rgba(57,224,127,0.25)]`}
    />
  );
}

export function FooterLogo() {
  return (
    <Image
      src={LOGO_SRC}
      alt={siteConfig.name}
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      className="h-9 w-auto"
    />
  );
}
