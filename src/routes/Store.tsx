import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SectionTitle } from "../components/SectionTitle";
import { listVisibleModels } from "../lib/firestore";
import type { ModelDoc } from "../lib/types";
import { moneyUSD, uniq } from "../lib/utils";
import { Toast } from "../components/Toast";

type Row = { id: string } & ModelDoc;

export function Store() {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [onlyFree, setOnlyFree] = useState(false);
  const [onlyPaid, setOnlyPaid] = useState(false);
  const [category, setCategory] = useState<string>("All");
  const [tag, setTag] = useState<string>("All");
  const [toast, setToast] = useState<{ open: boolean; text: string; kind: "info" | "ok" | "err" }>({
    open: false,
    text: "",
    kind: "info"
  });

  useEffect(() => {
    (async () => {
      try {
        const rows = await listVisibleModels();
        setItems(rows.filter((x) => x.kind === "3d" && !!x.fileUrl));
      } catch {
        setToast({ open: true, text: "Failed to load store. Check Firestore rules & visibility.", kind: "err" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = useMemo(() => ["All", ...uniq(items.map((x) => x.category).filter(Boolean))], [items]);
  const tags = useMemo(() => ["All", ...uniq(items.flatMap((x) => x.tags ?? []).filter(Boolean))], [items]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items.filter((m) => {
      if (onlyFree && !m.isFree) return false;
      if (onlyPaid && m.isFree) return false;
      if (category !== "All" && m.category !== category) return false;
      if (tag !== "All" && !(m.tags ?? []).includes(tag)) return false;
      if (!s) return true;
      return (m.title + " " + m.description + " " + (m.tags ?? []).join(" ")).toLowerCase().includes(s);
    });
  }, [items, q, onlyFree, onlyPaid, category, tag]);

  const hasFilters = q.trim() || onlyFree || onlyPaid || category !== "All" || tag !== "All";

  return (
    <div className="container-pad py-10">
      <SectionTitle
        title="3D Store"
        subtitle="Interactive previews, free downloads, and paid assets via payment links."
      />

      <div className="card p-4">
        <div className="grid gap-3 md:grid-cols-12 md:items-end">
          <div className="md:col-span-4">
            <div className="label">Search</div>
            <input className="input" placeholder="Search models…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="md:col-span-3">
            <div className="label">Category</div>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3">
            <div className="label">Tag</div>
            <select className="input" value={tag} onChange={(e) => setTag(e.target.value)}>
              {tags.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 flex gap-2">
            <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
              <input type="checkbox" checked={onlyFree} onChange={(e) => { setOnlyFree(e.target.checked); if (e.target.checked) setOnlyPaid(false); }} />
              Free
            </label>
            <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
              <input type="checkbox" checked={onlyPaid} onChange={(e) => { setOnlyPaid(e.target.checked); if (e.target.checked) setOnlyFree(false); }} />
              Paid
            </label>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
          <div>{loading ? "Loading models…" : `${filtered.length} result${filtered.length === 1 ? "" : "s"}`}</div>
          {hasFilters ? (
            <button
              type="button"
              className="btn-ghost px-3 py-1.5 text-xs"
              onClick={() => {
                setQ("");
                setOnlyFree(false);
                setOnlyPaid(false);
                setCategory("All");
                setTag("All");
              }}
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {[0, 1, 2].map((n) => (
            <div key={n} className="card overflow-hidden p-5">
              <div className="h-44 w-full animate-pulse rounded-xl bg-white/10" />
              <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-white/10" />
              <div className="mt-3 h-3 w-full animate-pulse rounded bg-white/10" />
              <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-white/10" />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {filtered.map((m) => (
            <Link key={m.id} to={`/model/${m.id}`} className="card overflow-hidden transition hover:bg-white/10">
              {m.posterUrl ? (
                <img src={m.posterUrl} alt={m.title} className="h-44 w-full object-cover" loading="lazy" />
              ) : (
                <div className="h-44 w-full bg-white/5" />
              )}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-extrabold">{m.title}</div>
                    <div className="mt-1 text-sm text-slate-300 line-clamp-2">{m.description}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="badge">{m.isFree ? "FREE" : moneyUSD(m.priceUSD) || "PAID"}</div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="badge">{m.category}</span>
                  {(m.tags ?? []).slice(0, 4).map((t) => (
                    <span key={t} className="badge">#{t}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 ? (
        <div className="mt-6 card p-8 text-slate-300">
          No results. Try changing filters or publish more 3D items from Admin.
        </div>
      ) : null}

      <Toast open={toast.open} text={toast.text} kind={toast.kind} onClose={() => setToast((t) => ({ ...t, open: false }))} />
    </div>
  );
}
