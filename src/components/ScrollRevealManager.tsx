import { useEffect } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";

export function ScrollRevealManager() {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(".reveal-up"));
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) entry.target.classList.add("is-revealed");
      }
    }, { threshold: 0.2 });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [reduced]);

  return null;
}
