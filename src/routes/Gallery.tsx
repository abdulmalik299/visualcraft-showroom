import { useEffect, useMemo, useState } from "react";
import { SectionTitle } from "../components/SectionTitle";
import { Toast } from "../components/Toast";
import { listR2Objects, type R2Object } from "../lib/r2";
import { humanizeName, inferTags } from "../lib/media";
import { Input } from "../components/ui/Input";
import { Chip } from "../components/ui/Chip";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { Skeleton } from "../components/ui/Skeleton";

type GalleryCard = {
  item: R2Object;
  title: string;
  tags: string[];
};

function useGalleryRows(items: R2Object[]): GalleryCard[] {
  return useMemo(
    () =>
      items.map((item) => ({
        item,
        title: humanizeName(item.baseName),
        tags: inferTags(item.name)
      })),
    [items]
  );
}

export function Gallery() {
  const [items, setItems] = useState<R2Object[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("All");
  const [active, setActive] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
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
        setToast({ open: true, text: "Gallery could not be loaded.", kind: "err" });
      } finally {
        if (mounted && !silent) setLoading(false);
      }
    };

    load();
    const interval = window.setInterval(() => load(true), 60_000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const rows = useGalleryRows(items);
  const tagFilters = useMemo(() => {
    const tags = new Set<string>();
    for (const row of rows) row.tags.forEach((tag) => tags.add(tag));
    return ["All", ...Array.from(tags).slice(0, 10)];
  }, [rows]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((row) => {
      const queryMatch = !s || row.title.toLowerCase().includes(s) || row.tags.some((tag) => tag.includes(s));
      const filterMatch = filter === "All" || row.tags.includes(filter);
      return queryMatch && filterMatch;
    });
  }, [rows, q, filter]);

  const activeItem = active == null ? null : filtered[active];

  const resetTransform = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const closeModal = () => {
    setActive(null);
    resetTransform();
  };

  const nav = (dir: 1 | -1) => {
    if (active == null || filtered.length === 0) return;
    setActive((active + dir + filtered.length) % filtered.length);
    resetTransform();
  };

  useEffect(() => {
    if (active == null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
      if (event.key === "ArrowRight") nav(1);
      if (event.key === "ArrowLeft") nav(-1);
      if (event.key === "+") setScale((s) => Math.min(4, s + 0.2));
      if (event.key === "-") setScale((s) => Math.max(1, s - 0.2));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, filtered.length]);

  const copyLink = async () => {
    if (!activeItem) return;
    try {
      await navigator.clipboard.writeText(activeItem.item.url);
      setToast({ open: true, text: "Artwork link copied.", kind: "ok" });
    } catch {
      setToast({ open: true, text: "Unable to copy link.", kind: "err" });
    }
  };

  return (
    <div className="shell section-gap">
      <SectionTitle
        title="Gallery"
        subtitle="A quiet archive of composition, material, and atmosphere."
        right={<Input className="w-full md:w-80" placeholder="Search frames" value={q} onChange={(e) => setQ(e.target.value)} />}
      />

      <div className="mb-8 flex flex-wrap gap-2">
        {tagFilters.map((item) => (
          <Chip key={item} label={item} selected={filter === item} onClick={() => setFilter(item)} />
        ))}
      </div>

      {loading ? (
        <div className="columns-1 gap-5 space-y-5 sm:columns-2 xl:columns-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-72 w-full break-inside-avoid" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-slate-300">No work matched this search.</Card>
      ) : (
        <div className="columns-1 gap-5 space-y-5 sm:columns-2 xl:columns-3">
          {filtered.map((row, idx) => (
            <button
              key={row.item.key}
              type="button"
              className="group relative block w-full break-inside-avoid overflow-hidden rounded-3xl border border-white/15 bg-white/[0.03] text-left"
              onClick={() => setActive(idx)}
            >
              {!loaded.has(row.item.key) ? <Skeleton className="absolute inset-0 h-full w-full" /> : null}
              <img
                src={row.item.url}
                alt={row.title}
                loading="lazy"
                decoding="async"
                className="w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                onLoad={() => setLoaded((prev) => new Set(prev).add(row.item.key))}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-0 transition group-hover:opacity-100" />
              <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 transition group-hover:opacity-100">
                <p className="text-lg font-medium">{row.title}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal open={!!activeItem} onClose={closeModal} title="Artwork viewer" className="max-w-6xl">
        {activeItem ? (
          <div className="flex h-[88vh] flex-col gap-4 p-4 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pr-20">
              <div>
                <h3 className="text-xl font-medium">{activeItem.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{activeItem.tags.join(" · ") || "untagged"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn btn-ghost" onClick={() => setScale((s) => Math.min(4, s + 0.2))}>Zoom +</button>
                <button type="button" className="btn btn-ghost" onClick={() => setScale((s) => Math.max(1, s - 0.2))}>Zoom −</button>
                <button type="button" className="btn btn-ghost" onClick={copyLink}>Copy Link</button>
              </div>
            </div>

            <div className="relative flex-1 overflow-hidden rounded-3xl border border-white/10 bg-black/40">
              <img
                src={activeItem.item.url}
                alt={activeItem.title}
                className="h-full w-full cursor-grab select-none object-contain"
                style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
                onMouseDown={(e) => {
                  const startX = e.clientX - offset.x;
                  const startY = e.clientY - offset.y;
                  const move = (ev: MouseEvent) => setOffset({ x: ev.clientX - startX, y: ev.clientY - startY });
                  const up = () => {
                    window.removeEventListener("mousemove", move);
                    window.removeEventListener("mouseup", up);
                  };
                  window.addEventListener("mousemove", move);
                  window.addEventListener("mouseup", up);
                }}
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <button type="button" className="btn btn-ghost" onClick={() => nav(-1)}>← Previous</button>
              <button type="button" className="btn btn-ghost" onClick={() => nav(1)}>Next →</button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Toast open={toast.open} text={toast.text} kind={toast.kind} onClose={() => setToast((t) => ({ ...t, open: false }))} />
    </div>
  );
}
