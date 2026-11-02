import Image from "next/image";
import { siteConfig } from "@/lib/site";

const LOGO_WIDTH = 960;
const LOGO_HEIGHT = 240;

/** PatchMyROM wordmark (brand artwork). The alt text is the brand name, so the home link keeps its accessible name. */
export default function Logo({ className = "h-10 w-auto" }: { className?: string }) {
  return (
    <Image
      src={siteConfig.logo}
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
      src={siteConfig.logo}
      alt={siteConfig.name}
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      className="h-9 w-auto"
    />
  );
}
