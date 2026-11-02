import Link from "next/link";
import Logo from "@/components/ui/Logo";
import MobileMenu from "@/components/layout/MobileMenu";
import HeaderNavLinks from "@/components/layout/HeaderNavLinks";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 shadow-[0_1px_0_0_rgba(57,224,127,0.12)] backdrop-blur-md">
      <div aria-hidden className="h-0.5 w-full bg-gradient-to-r from-accent-green via-accent-blue to-accent-purple" />
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/">
          <Logo />
        </Link>

        <HeaderNavLinks />

        <MobileMenu />
      </div>
    </header>
  );
}
