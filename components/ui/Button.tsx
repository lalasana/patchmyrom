import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "outline";

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100 disabled:hover:scale-100";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-accent-green to-accent-green-dark text-background shadow-lg shadow-accent-green/20 hover:brightness-110 hover:shadow-accent-green/30 hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-accent-green",
  secondary:
    "border border-accent-blue/40 bg-accent-blue/10 text-accent-blue hover:border-accent-blue/70 hover:bg-accent-blue/15 focus-visible:ring-accent-blue",
  outline:
    "border border-border text-foreground hover:border-accent-blue/50 hover:bg-card-hover focus-visible:ring-accent-blue",
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
