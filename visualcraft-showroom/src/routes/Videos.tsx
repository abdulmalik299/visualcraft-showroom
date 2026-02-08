import React, { useEffect, useMemo, useState } from "react";
import { SectionTitle } from "../components/SectionTitle";
import { listVisibleVideos } from "../lib/firestore";
import type { VideoDoc } from "../lib/types";
import { Toast } from "../components/Toast";

type VideoRow = { id: string } & VideoDoc;

export function Videos() {
  const [items, setItems] = useState<VideoRow[]>([]);
  const [q, setQ] = useState("");
  const [toast, setToast] = useState<{ open: boolean; text: string; kind: "info" | "ok" | "err" }>({
    open: false,
    text: "",
    kind: "info"
  });

  useEffect(() => {
    (async () => {
      try {
        const rows = await listVisibleVideos();
        setItems(rows);
      } catch (e) {
        setToast({ open: true, text: "Failed to load videos. Check Firestore rules & visibility.", kind: "err" });
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((v) => (v.title + " " + v.description).toLowerCase().includes(s));
  }, [items, q]);

  return (
    <div className="container-pad py-10">
      <SectionTitle
        title="Videos"
        subtitle="Your published showreels, ads, motion graphics, and animation projects."
        right={
          <input
            className="input w-full md:w-80"
            placeholder="Search videos…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        }
      />

      {filtered.length === 0 ? (
        <div className="card p-8 text-slate-300">
          No videos yet. Add items from the Admin panel (videos must be <span className="badge">visible: true</span>).
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {filtered.map((v) => (
            <article key={v.id} className="card overflow-hidden">
              {v.thumbUrl ? (
                <img src={v.thumbUrl} alt={v.title} className="h-52 w-full object-cover" loading="lazy" />
              ) : (
                <div className="h-52 w-full bg-white/5" />
              )}
              <div className="p-5">
                <h3 className="text-lg font-extrabold">{v.title}</h3>
                <p className="mt-1 text-sm text-slate-300">{v.description}</p>
                <div className="mt-4">
                  <video
                    className="w-full rounded-xl border border-white/10 bg-black/30"
                    controls
                    preload="metadata"
                    src={v.url}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Toast open={toast.open} text={toast.text} kind={toast.kind} onClose={() => setToast((t) => ({ ...t, open: false }))} />
    </div>
  );
}
