import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useReducedMotion } from "../hooks/useReducedMotion";

export function ScrollRevealManager() {
  const reduced = useReducedMotion();
  const location = useLocation();

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(".reveal-up, .shadow-reveal, .story-reveal"));

    if (reduced) {
      nodes.forEach((node) => node.classList.add("is-revealed"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.18 });

    nodes.forEach((node) => {
      if (!node.classList.contains("is-revealed")) observer.observe(node);
    });

    return () => observer.disconnect();
  }, [location.pathname, reduced]);

  return null;
}
