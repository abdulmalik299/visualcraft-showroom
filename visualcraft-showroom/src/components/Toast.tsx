import { useEffect } from "react";
import { cx } from "../lib/utils";

export function Toast({
  open,
  text,
  kind = "info",
  onClose
}: {
  open: boolean;
  text: string;
  kind?: "info" | "ok" | "err";
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(onClose, 4500);
    return () => window.clearTimeout(t);
  }, [open, onClose]);

  return (
    <div
      className={cx(
        "pointer-events-none fixed bottom-4 left-0 right-0 z-[60] mx-auto w-full max-w-xl px-4 transition",
        open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      )}
      role="status"
      aria-live="polite"
    >
      <div
        className={cx(
          "card pointer-events-auto flex items-start justify-between gap-4 px-4 py-3",
          kind === "ok" && "border-emerald-400/30",
          kind === "err" && "border-rose-400/30"
        )}
      >
        <div className="text-sm text-slate-200">{text}</div>
        <button className="btn-ghost px-3 py-1 text-xs" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
