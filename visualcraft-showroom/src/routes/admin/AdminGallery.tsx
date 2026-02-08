import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { adminCreateModel, adminDeleteModel, adminUpdateModel } from "../../lib/firestore";
import { uploadFile } from "../../lib/storage";
import type { ModelDoc } from "../../lib/types";
import { safeTags } from "../../lib/utils";
import { Toast } from "../../components/Toast";

type Row = { id: string } & ModelDoc;

export function AdminGallery() {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploadPct, setUploadPct] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("render, branding");
  const [category, setCategory] = useState("Gallery");
  const [visible, setVisible] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [toast, setToast] = useState<{ open: boolean; text: string; kind: "info" | "ok" | "err" }>({
    open: false,
    text: "",
    kind: "info"
  });

  useEffect(() => {
    const q = query(collection(db, "models"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const all = snap.docs.map((d) => ({ id: d.id, ...(d.data() as ModelDoc) }));
        setRows(all.filter((x) => x.kind === "image"));
      },
      () => setToast({ open: true, text: "Failed to subscribe images.", kind: "err" })
    );
    return () => unsub();
  }, []);

  const canSubmit = useMemo(() => title.trim() && description.trim() && imageFile, [title, description, imageFile]);

  async function create() {
    if (!imageFile) return;
    setBusy(true);
    setUploadPct(null);
    try {
      const now = Date.now();
      const imgUrl = await uploadFile(
        `images/${now}-${imageFile.name}`,
        imageFile,
        (p) => setUploadPct(p.pct)
      );

      await adminCreateModel({
        kind: "image",
        title: title.trim(),
        description: description.trim(),
        tags: safeTags(tags),
        category: category.trim() || "Gallery",
        isFree: true,
        imageUrl: imgUrl,
        visible,
        createdAt: (await import("firebase/firestore")).serverTimestamp()
      });

      setTitle("");
      setDescription("");
      setImageFile(null);
      setToast({ open: true, text: "Image product created.", kind: "ok" });
    } catch (err: any) {
      setToast({ open: true, text: err?.message ?? "Create failed.", kind: "err" });
    } finally {
      setBusy(false);
      setUploadPct(null);
    }
  }

  async function toggleVisibility(id: string, v: boolean) {
    try {
      await adminUpdateModel(id, { visible: v });
    } catch {
      setToast({ open: true, text: "Update failed.", kind: "err" });
    }
  }

  async function del(id: string) {
    if (!confirm("Delete this image document?")) return;
    try {
      await adminDeleteModel(id);
      setToast({ open: true, text: "Deleted.", kind: "ok" });
    } catch {
      setToast({ open: true, text: "Delete failed.", kind: "err" });
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card p-6">
        <div className="text-sm font-extrabold">Add image product</div>
        <div className="mt-4 space-y-3">
          <div>
            <div className="label">Title</div>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <div className="label">Description</div>
            <textarea className="input min-h-[110px]" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <div className="label">Category</div>
              <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
            <div>
              <div className="label">Tags (comma separated)</div>
              <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} />
            </div>
          </div>

          <div>
            <div className="label">Image (JPG/PNG/WebP)</div>
            <input className="input" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
            Visible to public
          </label>

          {uploadPct != null ? <div className="text-xs text-slate-300">Uploading… {uploadPct}%</div> : null}

          <button className="btn-primary w-full" disabled={!canSubmit || busy} onClick={create}>
            {busy ? "Creating…" : "Create image product"}
          </button>
        </div>
      </div>

      <div className="card p-6">
        <div className="text-sm font-extrabold">Manage</div>
        <div className="mt-4 space-y-3">
          {rows.length === 0 ? (
            <div className="text-sm text-slate-300">No items yet.</div>
          ) : (
            rows.map((r) => (
              <div key={r.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {r.imageUrl ? (
                      <img src={r.imageUrl} alt={r.title} className="h-14 w-14 rounded-lg object-cover" loading="lazy" />
                    ) : (
                      <div className="h-14 w-14 rounded-lg bg-white/10" />
                    )}
                    <div>
                      <div className="font-bold">{r.title}</div>
                      <div className="text-sm text-slate-300 line-clamp-2">{r.description}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="badge">{r.category}</span>
                        {r.tags.slice(0, 4).map((t) => (
                          <span key={t} className="badge">#{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                      <input type="checkbox" checked={r.visible} onChange={(e) => toggleVisibility(r.id, e.target.checked)} />
                      Visible
                    </label>
                    <button className="btn-ghost px-3 py-1 text-xs" onClick={() => del(r.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Toast open={toast.open} text={toast.text} kind={toast.kind} onClose={() => setToast((t) => ({ ...t, open: false }))} />
    </div>
  );
}
