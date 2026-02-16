import { useEffect, useState } from "react";
import { useReducedMotion } from "../../hooks/useReducedMotion";

export function HeroPortal() {
  const reduced = useReducedMotion();
  const [spark, setSpark] = useState(0);

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

  return (
    <svg className="hero-portal" viewBox="0 0 600 600" aria-hidden="true">
      <defs>
        <linearGradient id="portal-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#69b8ff" />
          <stop offset="1" stopColor="#7e63ff" />
        </linearGradient>
      </defs>
      <g className={reduced ? "" : "portal-spin"}>
        <circle cx="300" cy="300" r="170" className="portal-ring" />
        <circle cx="300" cy="300" r="210" className="portal-ring portal-ring-thin" />
        <path d="M130 300h340M300 130v340M180 180l240 240M420 180L180 420" className="portal-grid" />
        <polygon points="300,170 420,300 300,430 180,300" className="portal-grid" />
      </g>
      <path key={spark} d="M120 308C220 252 280 286 376 242 435 215 468 187 520 164" className="portal-spark" />
      <circle cx="300" cy="300" r="120" fill="url(#portal-gradient)" fillOpacity="0.05" className={reduced ? "" : "portal-breathe"} />
    </svg>
  );
}
