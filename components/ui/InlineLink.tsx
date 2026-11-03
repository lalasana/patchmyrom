import Link from "next/link";
import type { ReactNode } from "react";

/** Descriptive in-text link, styled like the rest of the site's body links. */
export default function InlineLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="text-accent-blue hover:underline">
      {children}
    </Link>
  );
}
