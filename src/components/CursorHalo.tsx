import { useEffect, useRef } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";

export function CursorHalo() {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const node = ref.current;
    if (!node) return;
    const point = { x: -100, y: -100, tx: -100, ty: -100, scale: 1, tScale: 1 };
    let frame = 0;

    const onMove = (e: PointerEvent) => {
      point.tx = e.clientX;
      point.ty = e.clientY;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      point.tScale = el?.closest("button,a,[role='button'],input,select") ? 1.8 : 1;
    };

    const loop = () => {
      frame = requestAnimationFrame(loop);
      point.x += (point.tx - point.x) * 0.18;
      point.y += (point.ty - point.y) * 0.18;
      point.scale += (point.tScale - point.scale) * 0.16;
      node.style.transform = `translate(${point.x}px, ${point.y}px) scale(${point.scale})`;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
    };
  }, [reduced]);

  if (reduced) return null;
  return <div ref={ref} className="cursor-halo" aria-hidden="true" />;
}
