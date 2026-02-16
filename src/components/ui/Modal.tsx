import { useEffect, useRef, type ReactNode } from "react";
import { cx } from "../../lib/utils";
import { CloseIcon } from "../icons";

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
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open || !panelRef.current) {
      window.dispatchEvent(new CustomEvent("studio-modal-frame", { detail: null }));
      return;
    }
    window.dispatchEvent(new CustomEvent("studio-modal-frame", { detail: panelRef.current.getBoundingClientRect() }));
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/78 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-label={title ?? "Modal"}>
      <div className={cx("shell flex h-full items-center justify-center", className)}>
        <div ref={panelRef} className="card modal-panel relative max-h-[92vh] w-full overflow-hidden">
          <button type="button" className="icon-btn absolute right-4 top-4 z-20" onClick={onClose} aria-label="Close modal">
            <CloseIcon className="h-5 w-5" />
          </button>
          {children}
        </div>
      </div>
    </div>
  );
}
