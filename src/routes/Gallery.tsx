import React, { useEffect, useMemo, useState } from "react";
import { SectionTitle } from "../components/SectionTitle";
import { listVisibleModels } from "../lib/firestore";
import type { ModelDoc } from "../lib/types";
import { Toast } from "../components/Toast";

type Row = { id: string } & ModelDoc;

export function Gallery() {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [toast, setToast] = useState<{ open: boolean; text: string; kind: "info" | "ok" | "err" }>({
    open: false,
    text: "",
    kind: "info"
  });

  useEffect(() => {
    (async () => {
      try {
        const rows = await listVisibleModels();
        setItems(rows.filter((x) => x.kind === "image" && !!x.imageUrl));
      } catch {
        setToast({ open: true, text: "Failed to load gallery. Check Firestore rules & visibility.", kind: "err" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((m) => (m.title + " " + m.description + " " + (m.tags ?? []).join(" ")).toLowerCase().includes(s));
  }, [items, q]);

  return (
    <div className="container-pad py-10">
      <SectionTitle
        title="Image Products"
        subtitle="Posters, renders, thumbnails, brand visuals—published from Admin."
        right={
          <input
            className="input w-full md:w-80"
            placeholder="Search images…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        }
      />

      {loading ? (
        <div className="grid gap-5 md:grid-cols-3">
          {[0, 1, 2].map((n) => (
            <div key={n} className="card overflow-hidden p-4">
              <div className="h-56 animate-pulse rounded-xl bg-white/10" />
              <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-white/10" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-slate-300">
          No images yet. Add items from Admin as <span className="badge">kind: image</span> with an image upload.
        </div>
      ) : (
        <div className="columns-1 gap-5 space-y-5 sm:columns-2 lg:columns-3">
          {filtered.map((m) => (
            <figure key={m.id} className="card break-inside-avoid overflow-hidden">
              <img src={m.imageUrl!} alt={m.title} className="w-full object-cover" loading="lazy" />
              <figcaption className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-bold">{m.title}</div>
                  <span className="badge">{m.category}</span>
                </div>
                <p className="mt-1 text-sm text-slate-300">{m.description}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(m.tags ?? []).slice(0, 6).map((t) => (
                    <span key={t} className="badge">#{t}</span>
                  ))}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <Toast open={toast.open} text={toast.text} kind={toast.kind} onClose={() => setToast((t) => ({ ...t, open: false }))} />
    </div>
  );
}
