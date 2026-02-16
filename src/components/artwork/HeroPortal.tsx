import { useEffect, useState } from "react";
import { useReducedMotion } from "../../hooks/useReducedMotion";

export function HeroPortal() {
  const reduced = useReducedMotion();
  const [spark, setSpark] = useState(0);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (reduced) return;
    let timeout = 0;
    const loop = () => {
      setSpark((s) => s + 1);
      timeout = window.setTimeout(loop, 6000 + Math.random() * 6000);
    };
    timeout = window.setTimeout(loop, 3600);
    return () => window.clearTimeout(timeout);
  }, [reduced]);

  useEffect(() => {
    if (reduced) return;
    const onMove = (event: PointerEvent) => {
      const nx = (event.clientX / window.innerWidth - 0.5) * 2;
      const ny = (event.clientY / window.innerHeight - 0.5) * 2;
      setPointer({ x: nx, y: ny });
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduced]);

  return (
    <svg className="hero-portal" viewBox="0 0 600 600" aria-hidden="true" style={{ transform: `translate(${pointer.x * -8}px, ${pointer.y * -8}px)` }}>
      <defs>
        <linearGradient id="portal-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#53d7d3" />
          <stop offset="1" stopColor="#835bff" />
        </linearGradient>
      </defs>
      <g className={reduced ? "" : "portal-spin"}>
        <circle cx="300" cy="300" r="170" className="portal-ring" />
        <circle cx="300" cy="300" r="210" className="portal-ring portal-ring-thin" />
        <path d="M130 300h340M300 130v340M180 180l240 240M420 180L180 420" className="portal-grid" />
        <polygon points="300,170 420,300 300,430 180,300" className="portal-grid" />
      </g>
      <path key={spark} d="M120 308C220 252 280 286 376 242 435 215 468 187 520 164" className="portal-spark" />
      <circle cx="300" cy="300" r="120" fill="url(#portal-gradient)" fillOpacity="0.08" className={reduced ? "" : "portal-breathe"} />
    </svg>
  );
}
