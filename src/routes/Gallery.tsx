import { useEffect, useMemo, useRef, useState } from "react";
import { SectionTitle } from "../components/SectionTitle";
import { Input } from "../components/ui/Input";
import { Chip } from "../components/ui/Chip";
import { Card } from "../components/ui/Card";
import { Skeleton } from "../components/ui/Skeleton";
import { Modal } from "../components/ui/Modal";
import { Toast } from "../components/Toast";
import { inferCategory, inferTags, humanizeName } from "../lib/media";
import { type R2Object } from "../lib/r2";
import { CopyLinkIcon, ExpandIcon } from "../components/icons";
import { useR2Listing } from "../hooks/useR2Listing";

type Row = { item: R2Object; title: string; tags: string[]; category: string };
type PointerInfo = { x: number; y: number };

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function Gallery() {
  const { items: imageItems, loading } = useR2Listing("images/", ["jpg", "jpeg", "png", "webp", "avif", "gif"]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("All");
  const [active, setActive] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [cardLoaded, setCardLoaded] = useState<Record<string, boolean>>({});
  const [modalLoading, setModalLoading] = useState(true);
  const [modalProgress, setModalProgress] = useState(0);
  const [toast, setToast] = useState<{ open: boolean; text: string; kind: "info" | "ok" | "err" }>({ open: false, text: "", kind: "info" });

  const wheelTargetRef = useRef<HTMLImageElement | null>(null);
  const pointers = useRef<Map<number, PointerInfo>>(new Map());
  const pinchDistance = useRef<number | null>(null);
  const lastTap = useRef(0);
  const dragVelocity = useRef({ x: 0, y: 0 });
  const inertiaFrame = useRef<number | null>(null);

  const rows = useMemo<Row[]>(() => imageItems.map((item) => {
    const tags = inferTags(item.baseName);
    return { item, tags, title: humanizeName(item.baseName), category: inferCategory(tags) };
  }), [imageItems]);

  const tagFilters = useMemo(() => ["All", ...Array.from(new Set(rows.map((row) => row.category))).sort()], [rows]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((row) => {
      const queryMatch = !s || row.title.toLowerCase().includes(s) || row.tags.some((tag) => tag.includes(s));
      const filterMatch = filter === "All" || row.category === filter;
      return queryMatch && filterMatch;
    });
  }, [rows, q, filter]);

  const activeItem = active == null ? null : filtered[active];

  useEffect(() => {
    if (active == null) return;
    const preload = [filtered[(active + 1) % filtered.length], filtered[(active - 1 + filtered.length) % filtered.length]];
    preload.forEach((entry) => {
      if (!entry) return;
      const image = new Image();
      image.src = entry.item.url;
    });
  }, [active, filtered]);

  useEffect(() => {
    if (!activeItem) return;
    setModalLoading(true);
    setModalProgress(8);
    const id = window.setInterval(() => {
      setModalProgress((prev) => (prev >= 92 ? prev : prev + 7));
    }, 120);
    return () => window.clearInterval(id);
  }, [activeItem?.item.key]);

  const resetTransform = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    dragVelocity.current = { x: 0, y: 0 };
  };

  const nav = (dir: 1 | -1) => {
    if (active == null || filtered.length === 0) return;
    setIsAnimating(true);
    setActive((active + dir + filtered.length) % filtered.length);
    resetTransform();
    window.setTimeout(() => setIsAnimating(false), 250);
  };

  useEffect(() => {
    if (active == null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
      if (event.key === "ArrowRight") nav(1);
      if (event.key === "ArrowLeft") nav(-1);
      if (event.key === "+") setScale((s) => clamp(s + 0.2, MIN_SCALE, MAX_SCALE));
      if (event.key === "-") setScale((s) => clamp(s - 0.2, MIN_SCALE, MAX_SCALE));
      if (event.key.toLowerCase() === "z") resetTransform();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, filtered.length]);

  useEffect(() => {
    const node = wheelTargetRef.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const direction = event.deltaY < 0 ? 0.22 : -0.22;
      setScale((s) => clamp(s + direction, MIN_SCALE, MAX_SCALE));
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [activeItem?.item.key]);

  const copyLink = async () => {
    if (!activeItem) return;
    try {
      await navigator.clipboard.writeText(activeItem.item.url);
      setToast({ open: true, text: "Artwork link copied.", kind: "ok" });
    } catch {
      setToast({ open: true, text: "Unable to copy link.", kind: "err" });
    }
  };

  const applyInertia = () => {
    if (inertiaFrame.current) window.cancelAnimationFrame(inertiaFrame.current);
    const tick = () => {
      dragVelocity.current.x *= 0.92;
      dragVelocity.current.y *= 0.92;
      if (Math.abs(dragVelocity.current.x) < 0.2 && Math.abs(dragVelocity.current.y) < 0.2) return;
      setOffset((prev) => ({ x: prev.x + dragVelocity.current.x, y: prev.y + dragVelocity.current.y }));
      inertiaFrame.current = window.requestAnimationFrame(tick);
    };
    inertiaFrame.current = window.requestAnimationFrame(tick);
  };

  return (
    <div className="shell section-gap">
      <SectionTitle
        title="Gallery"
        subtitle="Filter, search, and explore every crafted frame in real time."
        right={<Input id="gallery-search" name="gallery-search" className="w-full md:w-80" placeholder="Search frames" value={q} onChange={(e) => setQ(e.target.value)} />}
      />

      <div className="mb-8 flex flex-wrap gap-2">
        {tagFilters.map((item) => <Chip key={item} label={item} selected={filter === item} onClick={() => setFilter(item)} />)}
      </div>

      {loading ? (
        <div className="columns-1 gap-5 space-y-5 sm:columns-2 xl:columns-3">{[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-72 w-full break-inside-avoid" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-slate-300">No work matched this search.</Card>
      ) : (
        <div className="columns-1 gap-5 space-y-5 sm:columns-2 xl:columns-3">
          {filtered.map((row, idx) => (
            <button key={row.item.key} type="button" className="group shadow-reveal relative block w-full break-inside-avoid overflow-hidden rounded-3xl border border-white/15 bg-white/[0.03] text-left" onClick={() => setActive(idx)}>
              {!cardLoaded[row.item.key] ? <Skeleton className="absolute inset-0 h-full w-full" /> : null}
              <img
                src={row.item.url}
                alt={row.title}
                loading="lazy"
                decoding="async"
                className="w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                onLoad={() => setCardLoaded((prev) => ({ ...prev, [row.item.key]: true }))}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-0 transition group-hover:opacity-100" />
              <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 transition group-hover:opacity-100">
                <p className="text-lg font-medium">{row.title}</p>
                <div className="mt-2 flex flex-wrap gap-2">{row.tags.slice(0, 4).map((tag) => <span key={tag} className="badge">{tag}</span>)}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal open={!!activeItem} onClose={() => setActive(null)} title="Artwork viewer" className="max-w-6xl">
        {activeItem ? (
          <div className="flex h-[88vh] flex-col gap-4 p-4 md:p-6" onTouchStart={(event) => {
            const now = Date.now();
            if (now - lastTap.current < 260) setScale((s) => (s > 1 ? 1 : 2.2));
            lastTap.current = now;
            if (event.touches.length === 2) {
              const [a, b] = [event.touches[0], event.touches[1]];
              pinchDistance.current = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
            }
          }} onTouchMove={(event) => {
            if (event.touches.length !== 2 || pinchDistance.current == null) return;
            const [a, b] = [event.touches[0], event.touches[1]];
            const nextDistance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
            const delta = (nextDistance - pinchDistance.current) * 0.01;
            pinchDistance.current = nextDistance;
            setScale((s) => clamp(s + delta, MIN_SCALE, MAX_SCALE));
          }} onTouchEnd={() => {
            pinchDistance.current = null;
          }}>
            <div className="flex flex-wrap items-center justify-between gap-3 pr-20">
              <div><h3 className="text-xl font-medium">{activeItem.title}</h3><p className="mt-1 text-sm text-slate-400">{activeItem.tags.join(" · ") || "untagged"}</p></div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="icon-btn" onClick={copyLink} aria-label="Copy link"><CopyLinkIcon className="h-4 w-4" /></button>
                <button type="button" className="icon-btn" onClick={() => document.documentElement.requestFullscreen().catch(() => undefined)} aria-label="Fullscreen"><ExpandIcon className="h-4 w-4" /></button>
              </div>
            </div>

            <div className="relative flex-1 overflow-hidden rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl">
              {modalLoading ? (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/45">
                  <div className="loader-spin h-8 w-8 rounded-full border-2 border-white/20 border-t-white/90" />
                  <div className="h-1.5 w-40 overflow-hidden rounded-full bg-white/15"><div className="h-full bg-indigo-300 transition-all" style={{ width: `${modalProgress}%` }} /></div>
                </div>
              ) : null}
              <img
                ref={wheelTargetRef}
                src={activeItem.item.url}
                alt={activeItem.title}
                className={isAnimating ? "h-full w-full cursor-grab select-none object-contain viewer-image is-switching" : "h-full w-full cursor-grab select-none object-contain viewer-image"}
                style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
                onLoad={() => {
                  setModalLoading(false);
                  setModalProgress(100);
                }}
                onPointerDown={(event) => {
                  pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
                  (event.currentTarget as HTMLImageElement).setPointerCapture(event.pointerId);
                  if (inertiaFrame.current) window.cancelAnimationFrame(inertiaFrame.current);
                }}
                onPointerMove={(event) => {
                  const start = pointers.current.get(event.pointerId);
                  if (!start || pointers.current.size > 1) return;
                  const dx = event.clientX - start.x;
                  const dy = event.clientY - start.y;
                  dragVelocity.current = { x: dx * 0.3, y: dy * 0.3 };
                  setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
                  pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
                }}
                onPointerUp={(event) => {
                  pointers.current.delete(event.pointerId);
                  if (pointers.current.size === 0) applyInertia();
                }}
                onDoubleClick={() => setScale((s) => (s > 1 ? 1 : 2.2))}
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <button type="button" className="btn btn-ghost" onClick={() => nav(-1)}>← Previous</button>
              <div className="flex gap-2"><button type="button" className="btn btn-ghost" onClick={() => setScale((s) => clamp(s + 0.2, MIN_SCALE, MAX_SCALE))}>Zoom +</button><button type="button" className="btn btn-ghost" onClick={() => setScale((s) => clamp(s - 0.2, MIN_SCALE, MAX_SCALE))}>Zoom −</button></div>
              <button type="button" className="btn btn-ghost" onClick={() => nav(1)}>Next →</button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Toast open={toast.open} text={toast.text} kind={toast.kind} onClose={() => setToast((t) => ({ ...t, open: false }))} />
    </div>
  );
}
