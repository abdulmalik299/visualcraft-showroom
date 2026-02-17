import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useReducedMotion } from "../../hooks/useReducedMotion";

type Layer = Float32Array;

type Anchor = { x: number; y: number; corners: Array<{ x: number; y: number }> };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function buildLayer(count: number, width: number, height: number, speed = 0.24) {
  const layer = new Float32Array(count * 6);
  for (let i = 0; i < count; i += 1) {
    const idx = i * 6;
    layer[idx] = Math.random() * width;
    layer[idx + 1] = Math.random() * height;
    layer[idx + 2] = (Math.random() - 0.5) * speed;
    layer[idx + 3] = (Math.random() - 0.5) * speed;
    layer[idx + 4] = 0.6 + Math.random() * 1.2;
    layer[idx + 5] = Math.random() * Math.PI * 2;
  }
  return layer;
}

export function ConstellationBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const anchorRef = useRef<Anchor | null>(null);
  const reducedMotion = useReducedMotion();
  const location = useLocation();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const pointer = { x: -1000, y: -1000, targetX: -1000, targetY: -1000, active: false };
    const viewport = { width: 1, height: 1, dpr: 1, scrollY: 0 };
    let intensity = 1;

    let far: Layer = new Float32Array();
    let mid: Layer = new Float32Array();
    let near: Layer = new Float32Array();
    let frame = 0;

    const resize = () => {
      viewport.width = window.innerWidth;
      viewport.height = window.innerHeight;
      viewport.dpr = clamp(window.devicePixelRatio || 1, 1, 2);
      canvas.width = Math.floor(viewport.width * viewport.dpr);
      canvas.height = Math.floor(viewport.height * viewport.dpr);
      ctx.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
      const density = window.matchMedia("(max-width: 768px)").matches ? 0.7 : 1;
      far = buildLayer(Math.floor(26 * density), viewport.width, viewport.height, 0.15);
      mid = buildLayer(Math.floor(40 * density), viewport.width, viewport.height, 0.2);
      near = buildLayer(Math.floor(54 * density), viewport.width, viewport.height, 0.26);
    };

    const drawLayer = (layer: Layer, color: string, alphaBase: number, influence: number, parallax: number) => {
      for (let i = 0; i < layer.length / 6; i += 1) {
        const idx = i * 6;
        let x = layer[idx];
        let y = layer[idx + 1];
        let vx = layer[idx + 2];
        let vy = layer[idx + 3];
        const radius = layer[idx + 4];
        let theta = layer[idx + 5];

        if (!reducedMotion) {
          vx = clamp(vx + (Math.random() - 0.5) * 0.003, -0.4, 0.4);
          vy = clamp(vy + (Math.random() - 0.5) * 0.003, -0.4, 0.4);
          x += vx;
          y += vy;
          theta += 0.005;
        }

        if (x < 0 || x > viewport.width) vx *= -1;
        if (y < 0 || y > viewport.height) vy *= -1;
        x = clamp(x, 0, viewport.width);
        y = clamp(y, 0, viewport.height);

        const dx = pointer.x - x;
        const dy = pointer.y - y;
        const dist = Math.hypot(dx, dy);
        if (pointer.active && dist < influence && !reducedMotion) {
          x += dx * 0.009;
          y += dy * 0.009;
        }

        layer[idx] = x;
        layer[idx + 1] = y;
        layer[idx + 2] = vx;
        layer[idx + 3] = vy;
        layer[idx + 5] = theta;

        const pulse = 0.72 + Math.sin(theta) * 0.24;
        ctx.fillStyle = `${color}${alphaBase * pulse * intensity})`;
        ctx.beginPath();
        ctx.arc(x, y + viewport.scrollY * parallax, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawConnections = () => {
      for (let i = 0; i < near.length / 6; i += 1) {
        const ai = i * 6;
        for (let j = i + 1; j < near.length / 6; j += 1) {
          const bi = j * 6;
          const dist = Math.hypot(near[ai] - near[bi], near[ai + 1] - near[bi + 1]);
          if (dist > 120) continue;
          const alpha = (1 - dist / 120) * (pointer.active ? 0.28 : 0.16) * intensity;
          ctx.strokeStyle = `rgba(118, 168, 255, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(near[ai], near[ai + 1] + viewport.scrollY * 0.04);
          ctx.lineTo(near[bi], near[bi + 1] + viewport.scrollY * 0.04);
          ctx.stroke();
        }
      }
    };

    const onMove = (event: PointerEvent) => {
      pointer.targetX = event.clientX;
      pointer.targetY = event.clientY;
      pointer.active = true;
    };

    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      pointer.targetX = touch.clientX;
      pointer.targetY = touch.clientY;
      pointer.active = true;
    };

    const onLeave = () => {
      pointer.active = false;
      pointer.targetX = -1000;
      pointer.targetY = -1000;
    };

    const onAnchor = (event: Event) => {
      const detail = (event as CustomEvent<DOMRect | null>).detail;
      if (!detail) {
        anchorRef.current = null;
        return;
      }
      anchorRef.current = {
        x: detail.left + detail.width / 2,
        y: detail.top + detail.height / 2,
        corners: [
          { x: detail.left, y: detail.top },
          { x: detail.right, y: detail.top },
          { x: detail.right, y: detail.bottom },
          { x: detail.left, y: detail.bottom }
        ]
      };
    };

    const onIntensity = (event: Event) => {
      const detail = (event as CustomEvent<number | undefined>).detail;
      intensity = clamp(detail ?? 1, 0.8, 1.45);
    };

    const animate = () => {
      frame = window.requestAnimationFrame(animate);
      pointer.x += (pointer.targetX - pointer.x) * 0.16;
      pointer.y += (pointer.targetY - pointer.y) * 0.16;
      ctx.clearRect(0, 0, viewport.width, viewport.height);

      drawLayer(far, "rgba(139, 158, 228, ", 0.2, 70, 0.02);
      drawLayer(mid, "rgba(122, 154, 255, ", 0.28, 110, 0.03);
      drawLayer(near, "rgba(132, 233, 220, ", 0.34, 165, 0.04);
      drawConnections();

      if (anchorRef.current && !reducedMotion) {
        ctx.strokeStyle = "rgba(120, 223, 220, 0.24)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        anchorRef.current.corners.forEach((point, idx) => {
          if (idx === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        });
        ctx.closePath();
        ctx.stroke();
      }
    };

    const onScroll = () => {
      viewport.scrollY = window.scrollY * 0.25;
    };

    resize();
    onScroll();
    frame = window.requestAnimationFrame(animate);

    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", resize);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointercancel", onLeave);
    window.addEventListener("studio-card-anchor", onAnchor as EventListener);
    window.addEventListener("studio-constellation-intensity", onIntensity as EventListener);
    window.setTimeout(resize, 0);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("orientationchange", resize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointercancel", onLeave);
      window.removeEventListener("studio-card-anchor", onAnchor as EventListener);
      window.removeEventListener("studio-constellation-intensity", onIntensity as EventListener);
    };
  }, [reducedMotion, location.pathname]);

  return <canvas ref={canvasRef} className="constellation-bg" aria-hidden="true" />;
}
