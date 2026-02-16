import React, { useEffect, useMemo, useState } from "react";
import { SectionTitle } from "../components/SectionTitle";
import { Toast } from "../components/Toast";
import { listR2Objects, type R2Object } from "../lib/r2";
import { humanizeName, inferCategory, inferTags } from "../lib/media";
import { Input } from "../components/ui/Input";
import { Chip } from "../components/ui/Chip";
import { Card } from "../components/ui/Card";

type GalleryCard = {
  item: R2Object;
  title: string;
  tags: string[];
  category: string;
};

const defaultFilters = ["All", "Logos", "Product", "Motion Stills", "UI", "Portrait", "Other"];

function useGalleryRows(items: R2Object[]): GalleryCard[] {
  return useMemo(
    () =>
      items.map((item) => {
        const tags = inferTags(item.name);
        return {
          item,
          title: humanizeName(item.baseName),
          tags,
          category: inferCategory(tags)
        };
      }),
    [items]
  );
}

export function Gallery() {
  const [items, setItems] = useState<R2Object[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("All");
  const [active, setActive] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; text: string; kind: "info" | "ok" | "err" }>({
    open: false,
    text: "",
    kind: "info"
  });

  useEffect(() => {
    let mounted = true;

    const load = async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const rows = await listR2Objects("images/", ["jpg", "jpeg", "png", "webp", "avif", "gif"]);
        if (!mounted) return;
        setItems(rows);
      } catch {
        if (!mounted) return;
        setToast({ open: true, text: "Failed to load gallery items.", kind: "err" });
      } finally {
        if (mounted && !silent) setLoading(false);
      }
    };

    load();
    const interval = window.setInterval(() => {
      load(true);
    }, 60_000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const rows = useGalleryRows(items);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((row) => {
      const queryMatch = !s || row.title.toLowerCase().includes(s) || row.tags.some((tag) => tag.includes(s));
      const filterMatch = filter === "All" || row.category === filter;
      return queryMatch && filterMatch;
    });
  }, [rows, q, filter]);

  const activeItem = active == null ? null : filtered[active];

  const closeModal = () => {
    setActive(null);
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setDragging(false);
  };

  const nav = (dir: 1 | -1) => {
    if (active == null || filtered.length === 0) return;
    const next = (active + dir + filtered.length) % filtered.length;
    setActive(next);
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  useEffect(() => {
    if (active == null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
      if (event.key === "ArrowRight") nav(1);
      if (event.key === "ArrowLeft") nav(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, filtered.length]);

  const copyLink = async () => {
    if (!activeItem) return;
    try {
      await navigator.clipboard.writeText(activeItem.item.url);
      setToast({ open: true, text: "Image link copied.", kind: "ok" });
    } catch {
      setToast({ open: true, text: "Could not copy image link.", kind: "err" });
    }
  };

  return (
    <div className="container-pad py-10">
      <SectionTitle
        title="Gallery"
        subtitle="A curated stream of artwork, product stills, and visual experiments."
        right={<Input className="w-full md:w-80" placeholder="Search artworks…" value={q} onChange={(e) => setQ(e.target.value)} />}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {defaultFilters.map((item) => (
          <Chip key={item} label={item} selected={filter === item} onClick={() => setFilter(item)} />
        ))}
      </div>

      {loading ? (
        <div className="grid gap-5 md:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <Card key={n} className="overflow-hidden p-4">
              <div className="h-56 animate-pulse rounded-xl bg-white/10" />
              <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-white/10" />
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-slate-300">No images matched your search.</Card>
      ) : (
        <div className="columns-1 gap-5 space-y-5 sm:columns-2 xl:columns-3">
          {filtered.map((row, idx) => (
            <button
              key={row.item.key}
              type="button"
              className="group relative block w-full break-inside-avoid overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-left"
              onClick={() => setActive(idx)}
              aria-label={`Open ${row.title}`}
            >
              <img src={row.item.url} alt={row.title} className="w-full object-cover" loading="lazy" decoding="async" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100" />
              <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                <p className="text-sm text-slate-300">{row.category}</p>
                <p className="text-lg font-semibold">{row.title}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {row.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="badge">{tag}</span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {activeItem ? (
        <div className="fixed inset-0 z-[60] bg-black/90 p-4" role="dialog" aria-modal="true" aria-label="Image viewer">
          <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-400">{activeItem.category}</p>
                <h3 className="text-lg font-semibold">{activeItem.title}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn btn-ghost" onClick={() => setScale((s) => Math.min(4, s + 0.25))}>Zoom in</button>
                <button type="button" className="btn btn-ghost" onClick={() => setScale((s) => Math.max(1, s - 0.25))}>Zoom out</button>
                <button type="button" className="btn btn-ghost" onClick={copyLink}>Copy link</button>
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Close</button>
              </div>
            </div>

            <div className="relative flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
              <img
                src={activeItem.item.url}
                alt={activeItem.title}
                className="h-full w-full cursor-grab object-contain"
                style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
                onMouseDown={(e) => {
                  setDragging(true);
                  const startX = e.clientX - offset.x;
                  const startY = e.clientY - offset.y;

                  const move = (ev: MouseEvent) => setOffset({ x: ev.clientX - startX, y: ev.clientY - startY });
                  const up = () => {
                    setDragging(false);
                    window.removeEventListener("mousemove", move);
                    window.removeEventListener("mouseup", up);
                  };

                  window.addEventListener("mousemove", move);
                  window.addEventListener("mouseup", up);
                }}
              />
              {dragging ? <span className="absolute right-3 top-3 badge">Panning</span> : null}
            </div>

            <div className="flex items-center justify-between">
              <button type="button" className="btn btn-ghost" onClick={() => nav(-1)} aria-label="Previous image">← Previous</button>
              <details className="text-sm text-slate-300">
                <summary className="cursor-pointer">Details</summary>
                <p className="mt-2 rounded-xl border border-white/10 bg-white/5 p-3 font-mono text-xs">{activeItem.item.key}</p>
              </details>
              <button type="button" className="btn btn-ghost" onClick={() => nav(1)} aria-label="Next image">Next →</button>
            </div>
          </div>
        </div>
      ) : null}

      <Toast open={toast.open} text={toast.text} kind={toast.kind} onClose={() => setToast((t) => ({ ...t, open: false }))} />
    </div>
  );
}
