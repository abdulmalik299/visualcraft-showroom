import { useEffect, useRef, useState } from "react";

export function SectionDivider() {
  const ref = useRef<SVGSVGElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisible(true);
    }, { threshold: 0.35 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <svg ref={ref} viewBox="0 0 1200 80" className="section-divider" aria-hidden="true">
      <path
        className={visible ? "divider-line is-visible" : "divider-line"}
        d="M0 40c120-28 240 28 360 0s240-28 360 0 240 28 480-2"
      />
    </svg>
  );
}
