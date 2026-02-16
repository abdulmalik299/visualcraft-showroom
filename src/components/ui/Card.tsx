import { useRef, type ReactNode } from "react";
import { cx } from "../../lib/utils";

type CardProps = { children: ReactNode; className?: string; interactive?: boolean };

export function Card({ children, className, interactive = false }: CardProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  const emitAnchor = (rect: DOMRect | null) => {
    window.dispatchEvent(new CustomEvent("studio-card-anchor", { detail: rect }));
  };

  return (
    <div
      ref={ref}
      className={cx("card", interactive ? "interactive-card" : "", className)}
      onPointerMove={(event) => {
        if (!interactive || !ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        const ry = (x - 0.5) * 8;
        const rx = (0.5 - y) * 8;
        ref.current.style.setProperty("--card-rx", `${rx}deg`);
        ref.current.style.setProperty("--card-ry", `${ry}deg`);
        ref.current.style.setProperty("--sheen-x", `${x * 100}%`);
      }}
      onPointerEnter={() => {
        if (!interactive || !ref.current) return;
        emitAnchor(ref.current.getBoundingClientRect());
      }}
      onPointerLeave={() => {
        if (!interactive || !ref.current) return;
        ref.current.style.setProperty("--card-rx", "0deg");
        ref.current.style.setProperty("--card-ry", "0deg");
        emitAnchor(null);
      }}
    >
      {children}
      {interactive ? <span className="card-brackets" aria-hidden="true" /> : null}
    </div>
  );
}
