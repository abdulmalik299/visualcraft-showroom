import React, { useEffect, useMemo, useState } from "react";
import { SectionTitle } from "../components/SectionTitle";
import { Toast } from "../components/Toast";
import { listR2Objects, type R2Object } from "../lib/r2";

export function Gallery() {
  const [items, setItems] = useState<R2Object[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
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
        setToast({ open: true, text: "Failed to load images from Cloudflare R2.", kind: "err" });
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

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((item) => item.name.toLowerCase().includes(s));
  }, [items, q]);

  return (
    <div className="container-pad py-10">
      <SectionTitle
        title="Gallery"
        subtitle="Live from Cloudflare R2: images/"
        right={
          <input className="input w-full md:w-80" placeholder="Search images…" value={q} onChange={(e) => setQ(e.target.value)} />
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
        <div className="card p-8 text-slate-300">No images found in the R2 bucket under <span className="badge">images/</span>.</div>
      ) : (
        <div className="columns-1 gap-5 space-y-5 sm:columns-2 lg:columns-3">
          {filtered.map((item) => (
            <figure key={item.key} className="card break-inside-avoid overflow-hidden">
              <img src={item.url} alt={item.name} className="w-full object-cover" loading="lazy" decoding="async" />
              <figcaption className="p-4">
                <div className="font-bold">{item.name}</div>
                <div className="mt-1 text-xs text-slate-400">{item.key}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <Toast open={toast.open} text={toast.text} kind={toast.kind} onClose={() => setToast((t) => ({ ...t, open: false }))} />
    </div>
  );
}
