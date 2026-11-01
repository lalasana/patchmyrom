import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "outline";

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100 disabled:hover:scale-100";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-b from-accent-green to-accent-green-dark text-background shadow-[0_4px_0_0_#0f6b30,0_8px_20px_-6px_rgba(57,224,127,0.45)] hover:brightness-110 hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_0_0_0_#0f6b30] focus-visible:ring-accent-green",
  secondary:
    "border border-accent-blue/40 bg-accent-blue/10 text-accent-blue shadow-[0_3px_0_0_rgba(76,201,240,0.25)] hover:border-accent-blue/70 hover:bg-accent-blue/15 active:translate-y-0.5 active:shadow-none focus-visible:ring-accent-blue",
  outline:
    "border border-border bg-card/40 text-foreground shadow-[0_3px_0_0_rgba(0,0,0,0.35)] hover:border-accent-blue/50 hover:bg-card-hover active:translate-y-0.5 active:shadow-none focus-visible:ring-accent-blue",
};

function buttonClasses(variant: ButtonVariant, fullWidth: boolean, className?: string) {
  return [baseClasses, variantClasses[variant], fullWidth ? "w-full" : "", className]
    .filter(Boolean)
    .join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

export function Button({ variant = "primary", fullWidth = false, className, ...props }: ButtonProps) {
  return <button className={buttonClasses(variant, fullWidth, className)} {...props} />;
}

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

export function ButtonLink({ href, variant = "primary", fullWidth = false, className, ...props }: ButtonLinkProps) {
  return <Link href={href} className={buttonClasses(variant, fullWidth, className)} {...props} />;
}
