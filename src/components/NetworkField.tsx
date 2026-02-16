import { useEffect, useRef } from "react";

const MAX_DISTANCE = 130;

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ox: number;
  oy: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function NetworkField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pointer = { x: -9999, y: -9999, active: false };
    let width = 1;
    let height = 1;
    let frame = 0;
    let particles: Particle[] = [];

    const init = () => {
      const dpr = window.devicePixelRatio || 1;
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const targetCount = reduceMotion ? 18 : clamp(Math.floor(width / 18), 22, 68);
      particles = Array.from({ length: targetCount }, () => {
        const x = Math.random() * width;
        const y = Math.random() * height;
        return {
          x,
          y,
          ox: x,
          oy: y,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5
        };
      });
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer.x = event.clientX - canvas.getBoundingClientRect().left;
      pointer.y = event.clientY - canvas.getBoundingClientRect().top;
      pointer.active = true;
    };

    const onPointerLeave = () => {
      pointer.active = false;
      pointer.x = -9999;
      pointer.y = -9999;
    };

    init();

    const animate = () => {
      frame = window.requestAnimationFrame(animate);
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        p.vx += (Math.random() - 0.5) * 0.008;
        p.vy += (Math.random() - 0.5) * 0.008;
        p.vx = clamp(p.vx, -0.45, 0.45);
        p.vy = clamp(p.vy, -0.45, 0.45);

        p.x += (p.ox - p.x) * 0.006;
        p.y += (p.oy - p.y) * 0.006;

        if (pointer.active && !reduceMotion) {
          const dx = pointer.x - p.x;
          const dy = pointer.y - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 180) {
            p.x += dx * 0.003;
            p.y += dy * 0.003;
          }
        }

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        p.x = clamp(p.x, 0, width);
        p.y = clamp(p.y, 0, height);
      }

      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const a = particles[i];
          const b = particles[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist > MAX_DISTANCE) continue;
          const alpha = 1 - dist / MAX_DISTANCE;
          ctx.strokeStyle = `rgba(148, 163, 184, ${alpha * 0.22})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      if (pointer.active && !reduceMotion) {
        for (const p of particles) {
          const dist = Math.hypot(pointer.x - p.x, pointer.y - p.y);
          if (dist > 140) continue;
          const alpha = 1 - dist / 140;
          ctx.strokeStyle = `rgba(196, 181, 253, ${alpha * 0.45})`;
          ctx.beginPath();
          ctx.moveTo(pointer.x, pointer.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
      }

      for (const p of particles) {
        ctx.fillStyle = "rgba(226, 232, 240, 0.78)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    frame = window.requestAnimationFrame(animate);

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("resize", init);

    return () => {
      window.cancelAnimationFrame(frame);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("resize", init);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
}
