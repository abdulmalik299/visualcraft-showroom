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
import { ChevronLeftIcon, ChevronRightIcon, CopyLinkIcon, DownloadIcon, ExpandIcon, LayoutJustifiedIcon, LayoutMasonryIcon, ZoomInIcon, ZoomOutIcon } from "../components/icons";
import { useR2Listing } from "../hooks/useR2Listing";

type Row = { item: R2Object; title: string; tags: string[]; category: string };

type LayoutMode = "masonry" | "justified";
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function Gallery() {
  const listing = useR2Listing("images/", ["jpg", "jpeg", "png", "webp", "avif", "gif"]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("All");
  const [layout, setLayout] = useState<LayoutMode>("masonry");
  const [active, setActive] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const [toast, setToast] = useState<{ open: boolean; text: string; kind: "info" | "ok" | "err" }>({ open: false, text: "", kind: "info" });
  const viewerRef = useRef<HTMLImageElement | null>(null);

  const rows = useMemo<Row[]>(() => listing.items.map((item) => {
    const tags = inferTags(item.baseName);
    const fileTags = item.baseName.split(/[-_\s]+/g).filter(Boolean);
    return { item, tags: Array.from(new Set([...tags, ...fileTags])), title: humanizeName(item.baseName), category: inferCategory(tags) };
  }), [listing.items]);

  const tagFilters = useMemo(() => ["All", ...Array.from(new Set(rows.flatMap((row) => [row.category, ...row.tags]))).slice(0, 20)], [rows]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((row) => {
      const queryMatch = !s || row.title.toLowerCase().includes(s) || row.tags.some((tag) => tag.toLowerCase().includes(s));
      const filterMatch = filter === "All" || row.category === filter || row.tags.includes(filter);
      return queryMatch && filterMatch;
    });
  }, [rows, q, filter]);

  const activeItem = active == null ? null : filtered[active];

  const nav = (dir: 1 | -1) => {
    if (active == null || filtered.length === 0) return;
    setActive((active + dir + filtered.length) % filtered.length);
    setScale(1);
  };

  useEffect(() => {
    if (active == null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
      if (event.key === "ArrowRight") nav(1);
      if (event.key === "ArrowLeft") nav(-1);
      if (event.key === "+") setScale((s) => clamp(s + 0.2, 1, 4));
      if (event.key === "-") setScale((s) => clamp(s - 0.2, 1, 4));
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
        subtitle="Browse still frames with adaptive layouts and full-artwork lightbox view."
        right={<Input id="gallery-search" name="gallery-search" className="w-full md:w-80" placeholder="Search artwork" value={q} onChange={(e) => setQ(e.target.value)} />}
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <button className={layout === "masonry" ? "icon-btn border-indigo-300/60" : "icon-btn"} onClick={() => setLayout("masonry")} aria-label="Masonry layout"><LayoutMasonryIcon className="h-4 w-4" /></button>
        <button className={layout === "justified" ? "icon-btn border-indigo-300/60" : "icon-btn"} onClick={() => setLayout("justified")} aria-label="Justified layout"><LayoutJustifiedIcon className="h-4 w-4" /></button>
        {tagFilters.map((tag) => <Chip key={tag} active={filter === tag} onClick={() => setFilter(tag)}>{tag}</Chip>)}
      </div>

      {listing.loading ? (
        <div className="grid gap-5 md:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((n) => <Card key={n} className="overflow-hidden p-4"><Skeleton className="h-52 w-full" /><Skeleton className="mt-3 h-5 w-2/3" /></Card>)}</div>
      ) : listing.error ? (
        <Card className="p-8 text-slate-300"><p>Gallery is unavailable right now.</p><button className="btn btn-ghost mt-3" onClick={() => listing.revalidate()}>Retry</button></Card>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-slate-300">No artwork matched your search.</Card>
      ) : (
        <div className={layout === "masonry" ? "gallery-masonry" : "gallery-justified"}>
          {filtered.map((row, idx) => (
            <button key={row.item.key} type="button" className="gallery-tile group" onClick={() => setActive(idx)}>
              <img src={row.item.url} alt={row.title} loading="lazy" decoding="async" className="w-full object-contain" />
              <div className="gallery-meta"><p className="text-base font-medium">{row.title}</p></div>
            </button>
          ))}
        </div>
      )}

      <Modal open={!!activeItem} onClose={() => setActive(null)} title="Artwork viewer" className="max-w-[95vw]">
        {activeItem ? (
          <div className="flex h-[90vh] flex-col gap-4 p-4 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pr-20">
              <div><h3 className="text-xl font-medium">{activeItem.title}</h3><p className="mt-1 text-sm text-slate-400">{activeItem.tags.join(" · ") || "untagged"}</p></div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="icon-btn" onClick={copyLink} aria-label="Copy link"><CopyLinkIcon className="h-4 w-4" /></button>
                <a className="icon-btn" href={activeItem.item.url} download aria-label="Download artwork"><DownloadIcon className="h-4 w-4" /></a>
                <button type="button" className="icon-btn" onClick={() => document.documentElement.requestFullscreen().catch(() => undefined)} aria-label="Fullscreen"><ExpandIcon className="h-4 w-4" /></button>
              </div>
            </div>

            <div className="relative flex-1 overflow-hidden rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl">
              <img
                ref={viewerRef}
                src={activeItem.item.url}
                alt={activeItem.title}
                className="h-full w-full select-none object-contain viewer-image"
                style={{ transform: `scale(${scale})` }}
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <button type="button" className="icon-btn" onClick={() => nav(-1)} aria-label="Previous"><ChevronLeftIcon className="h-5 w-5" /></button>
              <div className="flex gap-2">
                <button type="button" className="icon-btn" onClick={() => setScale((s) => clamp(s + 0.2, 1, 4))} aria-label="Zoom in"><ZoomInIcon className="h-5 w-5" /></button>
                <button type="button" className="icon-btn" onClick={() => setScale((s) => clamp(s - 0.2, 1, 4))} aria-label="Zoom out"><ZoomOutIcon className="h-5 w-5" /></button>
              </div>
              <button type="button" className="icon-btn" onClick={() => nav(1)} aria-label="Next"><ChevronRightIcon className="h-5 w-5" /></button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Toast open={toast.open} text={toast.text} kind={toast.kind} onClose={() => setToast((t) => ({ ...t, open: false }))} />
    </div>
  );
}
