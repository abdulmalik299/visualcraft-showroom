import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useReducedMotion } from "../hooks/useReducedMotion";

export function RouteTransitionOverlay() {
  const location = useLocation();
  const reduced = useReducedMotion();
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (reduced) return;
    setActive(true);
    const id = window.setTimeout(() => setActive(false), 280);
    return () => window.clearTimeout(id);
  }, [location.pathname, reduced]);

  return <div className={active ? "route-fade-overlay is-active" : "route-fade-overlay"} aria-hidden="true" />;
}
