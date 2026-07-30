import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  children: ReactNode;
}

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 font-sans font-semibold text-[15px] leading-none whitespace-nowrap transition-colors active:translate-y-px disabled:opacity-55 disabled:cursor-not-allowed disabled:active:translate-y-0";

const VARIANTS = {
  primary: "bg-ink text-surface hover:bg-accent-strong",
  secondary: "bg-surface text-ink border border-border-strong hover:border-accent-strong hover:text-accent-strong",
  ghost: "bg-transparent text-ink-muted px-3 py-2 hover:text-ink hover:bg-border",
  danger: "bg-danger-soft text-danger border border-transparent hover:bg-danger hover:text-surface",
} as const;

export function Button({ variant = "primary", className, children, ...rest }: ButtonProps) {
  const classes = [BASE, VARIANTS[variant], className].filter(Boolean).join(" ");
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
