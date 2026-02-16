import { useEffect, useRef } from "react";
import { useReducedMotion } from "../../hooks/useReducedMotion";

type Anchor = { x: number; y: number; corners: Array<{ x: number; y: number }>; weight: number };

const FAR_BASE = 36;
const NEAR_BASE = 52;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function buildLayer(count: number, width: number, height: number) {
  const layer = new Float32Array(count * 6);
  for (let i = 0; i < count; i += 1) {
    const idx = i * 6;
    layer[idx] = Math.random() * width;
    layer[idx + 1] = Math.random() * height;
    layer[idx + 2] = (Math.random() - 0.5) * 0.2;
    layer[idx + 3] = (Math.random() - 0.5) * 0.2;
    layer[idx + 4] = 0.4 + Math.random() * 0.7;
    layer[idx + 5] = Math.random() * Math.PI * 2;
  }
  return layer;
}

export function ConstellationBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const anchorRef = useRef<Anchor | null>(null);
  const modalRef = useRef<{ bounds: DOMRect; alpha: number; tracing: number } | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const pointer = { x: -1000, y: -1000, targetX: -1000, targetY: -1000, active: false };
    const viewport = { width: 1, height: 1, dpr: 1 };
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const densityFactor = isMobile ? 0.6 : 1;

    let far = new Float32Array();
    let near = new Float32Array();
    let frame = 0;
    let lastMove = 0;

    const resize = () => {
      viewport.width = window.innerWidth;
      viewport.height = window.innerHeight;
      viewport.dpr = clamp(window.devicePixelRatio || 1, 1, 2);
      canvas.width = Math.floor(viewport.width * viewport.dpr);
      canvas.height = Math.floor(viewport.height * viewport.dpr);
      ctx.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
      far = buildLayer(Math.floor(FAR_BASE * densityFactor), viewport.width, viewport.height);
      near = buildLayer(Math.floor(NEAR_BASE * densityFactor), viewport.width, viewport.height);
    };

    const onMove = (event: PointerEvent) => {
      const now = performance.now();
      if (now - lastMove < 24) return;
      lastMove = now;
      pointer.targetX = event.clientX;
      pointer.targetY = event.clientY;
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
      const corners = [
        { x: detail.left, y: detail.top },
        { x: detail.right, y: detail.top },
        { x: detail.right, y: detail.bottom },
        { x: detail.left, y: detail.bottom }
      ];
      anchorRef.current = {
        x: detail.left + detail.width / 2,
        y: detail.top + detail.height / 2,
        corners,
        weight: 1
      };
    };

    const onModal = (event: Event) => {
      const detail = (event as CustomEvent<DOMRect | null>).detail;
      if (!detail) {
        if (modalRef.current) modalRef.current.alpha = 0;
        return;
      }
      modalRef.current = { bounds: detail, alpha: 1, tracing: 0 };
    };

    const drawLayer = (layer: Float32Array, nearLayer: boolean) => {
      const len = layer.length / 6;
      for (let i = 0; i < len; i += 1) {
        const idx = i * 6;
        let x = layer[idx];
        let y = layer[idx + 1];
        let vx = layer[idx + 2];
        let vy = layer[idx + 3];
        const radius = layer[idx + 4];
        let theta = layer[idx + 5];

        if (!reducedMotion) {
          vx = clamp(vx + (Math.random() - 0.5) * (nearLayer ? 0.006 : 0.003), -0.4, 0.4);
          vy = clamp(vy + (Math.random() - 0.5) * (nearLayer ? 0.006 : 0.003), -0.4, 0.4);
          x += vx;
          y += vy;
          theta += 0.005;
        }

        if (x < 0 || x > viewport.width) vx *= -1;
        if (y < 0 || y > viewport.height) vy *= -1;
        x = clamp(x, 0, viewport.width);
        y = clamp(y, 0, viewport.height);

        const influence = nearLayer ? 180 : 110;
        const dx = pointer.x - x;
        const dy = pointer.y - y;
        const dist = Math.hypot(dx, dy);
        if (!reducedMotion && pointer.active && dist < influence) {
          x += dx * (nearLayer ? 0.012 : 0.006);
          y += dy * (nearLayer ? 0.012 : 0.006);
        }

        if (nearLayer && anchorRef.current) {
          const ax = anchorRef.current.x - x;
          const ay = anchorRef.current.y - y;
          const ad = Math.hypot(ax, ay);
          if (ad < 240) {
            x += ax * 0.004;
            y += ay * 0.004;
          }
        }

        layer[idx] = x;
        layer[idx + 1] = y;
        layer[idx + 2] = vx;
        layer[idx + 3] = vy;
        layer[idx + 5] = theta;

        const pulse = 0.65 + Math.sin(theta) * 0.25;
        ctx.fillStyle = nearLayer
          ? `rgba(186, 208, 255, ${0.55 * pulse})`
          : `rgba(150, 165, 210, ${0.26 * pulse})`;
        ctx.beginPath();
        ctx.arc(x, y, nearLayer ? radius : radius * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawConnections = () => {
      for (let i = 0; i < near.length / 6; i += 1) {
        const ai = i * 6;
        for (let j = i + 1; j < near.length / 6; j += 1) {
          const bi = j * 6;
          const dist = Math.hypot(near[ai] - near[bi], near[ai + 1] - near[bi + 1]);
          if (dist > 130) continue;
          const alpha = (1 - dist / 130) * 0.18;
          ctx.strokeStyle = `rgba(136, 164, 255, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(near[ai], near[ai + 1]);
          ctx.lineTo(near[bi], near[bi + 1]);
          ctx.stroke();
        }

        if (pointer.active) {
          const dist = Math.hypot(near[ai] - pointer.x, near[ai + 1] - pointer.y);
          if (dist < 160) {
            const alpha = (1 - dist / 160) * 0.45;
            ctx.strokeStyle = `rgba(160, 142, 255, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(pointer.x, pointer.y);
            ctx.lineTo(near[ai], near[ai + 1]);
            ctx.stroke();
          }
        }

        if (anchorRef.current) {
          const centerDist = Math.hypot(near[ai] - anchorRef.current.x, near[ai + 1] - anchorRef.current.y);
          if (centerDist < 210) {
            for (const corner of anchorRef.current.corners) {
              const d = Math.hypot(near[ai] - corner.x, near[ai + 1] - corner.y);
              if (d > 230) continue;
              const alpha = (1 - d / 230) * 0.2;
              ctx.strokeStyle = `rgba(146, 174, 255, ${alpha})`;
              ctx.beginPath();
              ctx.moveTo(near[ai], near[ai + 1]);
              ctx.lineTo(corner.x, corner.y);
              ctx.stroke();
            }
          }
        }
      }
    };

    const drawModalFrame = () => {
      const modal = modalRef.current;
      if (!modal) return;
      if (modal.alpha <= 0) {
        modalRef.current = null;
        return;
      }
      const { left, top, width, height } = modal.bounds;
      const perimeter = width * 2 + height * 2;
      modal.tracing = clamp(modal.tracing + 32, 0, perimeter);
      if (!pointer.active && modal.alpha > 0.2) modal.alpha -= 0.004;

      ctx.strokeStyle = `rgba(167, 192, 255, ${modal.alpha * 0.55})`;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([10, 12]);
      ctx.lineDashOffset = -frame * 0.3;
      ctx.strokeRect(left - 8, top - 8, width + 16, height + 16);
      ctx.setLineDash([]);

      const traced = modal.tracing;
      ctx.strokeStyle = `rgba(124, 161, 255, ${modal.alpha * 0.65})`;
      ctx.beginPath();
      ctx.moveTo(left - 8, top - 8);
      let remain = traced;
      const segments = [
        { dx: width + 16, dy: 0 },
        { dx: 0, dy: height + 16 },
        { dx: -(width + 16), dy: 0 },
        { dx: 0, dy: -(height + 16) }
      ];
      let cx = left - 8;
      let cy = top - 8;
      for (const seg of segments) {
        const segLen = Math.hypot(seg.dx, seg.dy);
        if (remain <= 0) break;
        const t = Math.min(1, remain / segLen);
        cx += seg.dx * t;
        cy += seg.dy * t;
        ctx.lineTo(cx, cy);
        remain -= segLen;
      }
      ctx.stroke();
    };

    const tick = () => {
      frame = window.requestAnimationFrame(tick);
      pointer.x += (pointer.targetX - pointer.x) * 0.12;
      pointer.y += (pointer.targetY - pointer.y) * 0.12;
      ctx.clearRect(0, 0, viewport.width, viewport.height);

      if (reducedMotion) {
        for (let i = 0; i < near.length / 6; i += 1) {
          const idx = i * 6;
          ctx.fillStyle = "rgba(170, 184, 225, 0.26)";
          ctx.beginPath();
          ctx.arc(near[idx], near[idx + 1], 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
        return;
      }

      drawLayer(far, false);
      drawLayer(near, true);
      drawConnections();
      drawModalFrame();
    };

    resize();
    frame = window.requestAnimationFrame(tick);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    window.addEventListener("studio-card-anchor", onAnchor as EventListener);
    window.addEventListener("studio-modal-frame", onModal as EventListener);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("studio-card-anchor", onAnchor as EventListener);
      window.removeEventListener("studio-modal-frame", onModal as EventListener);
    };
  }, [reducedMotion]);

  return <canvas className="pointer-events-none fixed inset-0 z-0 h-full w-full" ref={canvasRef} aria-hidden="true" />;
}
