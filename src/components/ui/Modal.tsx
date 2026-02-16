import type { ReactNode } from "react";
import { cx } from "../../lib/utils";

export function Modal({
  open,
  title,
  children,
  onClose,
  className
}: {
  open: boolean;
  title?: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={title ?? "Modal"}>
      <div className={cx("shell flex h-full items-center justify-center", className)}>
        <div className="card relative max-h-[92vh] w-full overflow-hidden">
          <button type="button" className="btn btn-ghost absolute right-4 top-4 z-20 px-3 py-1 text-xs" onClick={onClose}>
            Close
          </button>
          {children}
        </div>
      </div>
    </div>
  );
}
