import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { adminCreateModel, adminDeleteModel, adminUpdateModel } from "../../lib/firestore";
import { uploadFile } from "../../lib/storage";
import type { ModelDoc } from "../../lib/types";
import { moneyUSD, safeTags } from "../../lib/utils";
import { Toast } from "../../components/Toast";

type Row = { id: string } & ModelDoc;

export function AdminModels() {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploadPct, setUploadPct] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("Includes: GLB model + textures (if any).\nRecommended engine: Web / Blender / Unity / Unreal.");
  const [tags, setTags] = useState("scifi, props");
  const [category, setCategory] = useState("Props");
  const [visible, setVisible] = useState(true);

  const [isFree, setIsFree] = useState(false);
  const [priceUSD, setPriceUSD] = useState<string>("9.99");

  const [modelFile, setModelFile] = useState<File | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);

  const [stripeLink, setStripeLink] = useState("");
  const [paypalLink, setPaypalLink] = useState("");
  const [payoneerLink, setPayoneerLink] = useState("");

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
        setRows(all.filter((x) => x.kind === "3d"));
      },
      () => setToast({ open: true, text: "Failed to subscribe models.", kind: "err" })
    );
    return () => unsub();
  }, []);

  const canSubmit = useMemo(() => title.trim() && description.trim() && modelFile, [title, description, modelFile]);

  async function create() {
    if (!modelFile) return;
    setBusy(true);
    setUploadPct(null);
    try {
      const now = Date.now();
      const fileUrl = await uploadFile(
        `models/${now}-${modelFile.name}`,
        modelFile,
        (p) => setUploadPct(p.pct)
      );

      let posterUrl: string | undefined;
      if (posterFile) {
        posterUrl = await uploadFile(`model-posters/${now}-${posterFile.name}`, posterFile, (p) => setUploadPct(p.pct));
      }

      const price = Number(priceUSD);
      const doc: ModelDoc = {
        kind: "3d",
        title: title.trim(),
        description: description.trim(),
        tags: safeTags(tags),
        category: category.trim() || "3D",
        isFree,
        priceUSD: isFree ? undefined : Number.isFinite(price) ? price : undefined,
        fileUrl,
        posterUrl,
        stripeLink: stripeLink.trim() || undefined,
        paypalLink: paypalLink.trim() || undefined,
        payoneerLink: payoneerLink.trim() || undefined,
        visible,
        createdAt: (await import("firebase/firestore")).serverTimestamp()
      };

      await adminCreateModel(doc);

      setTitle("");
      setModelFile(null);
      setPosterFile(null);
      setToast({ open: true, text: "3D model created.", kind: "ok" });
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
    if (!confirm("Delete this model document?")) return;
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
        <div className="text-sm font-extrabold">Add 3D model</div>

        <div className="mt-4 space-y-3">
          <div>
            <div className="label">Title</div>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <div className="label">Description</div>
            <textarea className="input min-h-[140px]" value={description} onChange={(e) => setDescription(e.target.value)} />
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

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <div className="label">Model file (GLB/GLTF)</div>
              <input className="input" type="file" accept=".glb,.gltf,model/gltf-binary,model/gltf+json" onChange={(e) => setModelFile(e.target.files?.[0] ?? null)} />
            </div>
            <div>
              <div className="label">Poster (optional)</div>
              <input className="input" type="file" accept="image/*" onChange={(e) => setPosterFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} />
              Free model (direct download)
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
              Visible to public
            </label>
          </div>

          {!isFree ? (
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <div className="label">Price (USD)</div>
                <input className="input" value={priceUSD} onChange={(e) => setPriceUSD(e.target.value)} />
                <div className="mt-1 text-xs text-slate-400">Displayed as: {moneyUSD(Number(priceUSD)) || "—"}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
                For paid items, add payment links below (Stripe/PayPal/Payoneer). No backend needed.
              </div>
            </div>
          ) : null}

          {!isFree ? (
            <div className="space-y-3">
              <div>
                <div className="label">Stripe payment link (card)</div>
                <input className="input" placeholder="https://buy.stripe.com/..." value={stripeLink} onChange={(e) => setStripeLink(e.target.value)} />
              </div>
              <div>
                <div className="label">PayPal link</div>
                <input className="input" placeholder="https://www.paypal.com/..." value={paypalLink} onChange={(e) => setPaypalLink(e.target.value)} />
              </div>
              <div>
                <div className="label">Payoneer link (invoice/request)</div>
                <input className="input" placeholder="https://..." value={payoneerLink} onChange={(e) => setPayoneerLink(e.target.value)} />
              </div>
            </div>
          ) : null}

          {uploadPct != null ? <div className="text-xs text-slate-300">Uploading… {uploadPct}%</div> : null}

          <button className="btn-primary w-full" disabled={!canSubmit || busy} onClick={create}>
            {busy ? "Creating…" : "Create 3D model"}
          </button>

          <div className="text-xs text-slate-400">
            Tip: keep GLB optimized (Draco/meshopt) to speed up previews and downloads.
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="text-sm font-extrabold">Manage</div>
        <div className="mt-4 space-y-3">
          {rows.length === 0 ? (
            <div className="text-sm text-slate-300">No models yet.</div>
          ) : (
            rows.map((r) => (
              <div key={r.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {r.posterUrl ? (
                      <img src={r.posterUrl} alt={r.title} className="h-14 w-14 rounded-lg object-cover" loading="lazy" />
                    ) : (
                      <div className="h-14 w-14 rounded-lg bg-white/10" />
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-bold">{r.title}</div>
                        <span className="badge">{r.isFree ? "FREE" : moneyUSD(r.priceUSD) || "PAID"}</span>
                        <span className="badge">{r.category}</span>
                      </div>
                      <div className="text-sm text-slate-300 line-clamp-2">{r.description}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <a className="btn-ghost px-3 py-1 text-xs" href={r.fileUrl} target="_blank" rel="noreferrer">
                          Open file
                        </a>
                        {r.stripeLink ? <a className="btn-ghost px-3 py-1 text-xs" href={r.stripeLink} target="_blank" rel="noreferrer">Stripe</a> : null}
                        {r.paypalLink ? <a className="btn-ghost px-3 py-1 text-xs" href={r.paypalLink} target="_blank" rel="noreferrer">PayPal</a> : null}
                        {r.payoneerLink ? <a className="btn-ghost px-3 py-1 text-xs" href={r.payoneerLink} target="_blank" rel="noreferrer">Payoneer</a> : null}
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
