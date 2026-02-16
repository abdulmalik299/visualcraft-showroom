import { useRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type PointerEvent, type ReactNode } from "react";
import { cx } from "../../lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";

type SharedProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  magnetic?: boolean;
};

function updateMagnet(target: HTMLElement | null, event: PointerEvent<HTMLElement>, magnetic: boolean) {
  if (!magnetic || !target) return;
  const rect = target.getBoundingClientRect();
  const dx = event.clientX - (rect.left + rect.width / 2);
  const dy = event.clientY - (rect.top + rect.height / 2);
  target.style.transform = `translate(${dx * 0.12}px, ${dy * 0.12}px)`;
}

function resetMagnet(target: HTMLElement | null) {
  if (!target) return;
  target.style.transform = "translate(0px, 0px)";
}

export function Button({ children, variant = "primary", className, magnetic = true, ...props }: SharedProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  const ref = useRef<HTMLButtonElement | null>(null);
  return (
    <button
      ref={ref}
      className={cx("btn", variantClass[variant], className)}
      onPointerMove={(event) => updateMagnet(ref.current, event, magnetic)}
      onPointerLeave={() => resetMagnet(ref.current)}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({ children, variant = "primary", className, magnetic = true, ...props }: SharedProps & AnchorHTMLAttributes<HTMLAnchorElement>) {
  const ref = useRef<HTMLAnchorElement | null>(null);
  return (
    <a
      ref={ref}
      className={cx("btn", variantClass[variant], className)}
      onPointerMove={(event) => updateMagnet(ref.current, event, magnetic)}
      onPointerLeave={() => resetMagnet(ref.current)}
      {...props}
    >
      {children}
    </a>
  );
}

const variantClass: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost"
};
