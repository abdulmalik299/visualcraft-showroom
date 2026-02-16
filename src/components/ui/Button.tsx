import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "../../lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";

type SharedProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
};

export function Button({ children, variant = "primary", className, ...props }: SharedProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cx("btn", variantClass[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({ children, variant = "primary", className, ...props }: SharedProps & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={cx("btn", variantClass[variant], className)} {...props}>
      {children}
    </a>
  );
}

const variantClass: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost"
};
