import Link from "next/link";
import MobileMenu from "@/components/layout/MobileMenu";
import HeaderNavLinks from "@/components/layout/HeaderNavLinks";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-black tracking-tight text-foreground">
            Patch
            <span className="bg-gradient-to-r from-accent-green to-accent-blue bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">
              MyROM
            </span>
          </span>
        </Link>

        <HeaderNavLinks />

        <MobileMenu />
      </div>
    </header>
  );
}
