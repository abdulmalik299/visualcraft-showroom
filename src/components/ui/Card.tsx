import type { ReactNode } from "react";
import { cx } from "../../lib/utils";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("card", className)}>{children}</div>;
}
