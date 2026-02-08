import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { adminCreateVideo, adminDeleteVideo, adminUpdateVideo } from "../../lib/firestore";
import { uploadFile } from "../../lib/storage";
import type { VideoDoc } from "../../lib/types";
import { Toast } from "../../components/Toast";

type Row = { id: string } & VideoDoc;

export function AdminVideos() {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploadPct, setUploadPct] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visible, setVisible] = useState(true);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);

  const [toast, setToast] = useState<{ open: boolean; text: string; kind: "info" | "ok" | "err" }>({
    open: false,
    text: "",
    kind: "info"
  });

  useEffect(() => {
    const q = query(collection(db, "videos"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => setRows(snap.docs.map((d) => ({ id: d.id, ...(d.data() as VideoDoc) }))),
      () => setToast({ open: true, text: "Failed to subscribe videos.", kind: "err" })
    );
    return () => unsub();
  }, []);

  const canSubmit = useMemo(() => title.trim() && description.trim() && videoFile, [title, description, videoFile]);

  async function create() {
    if (!videoFile) return;
    setBusy(true);
    setUploadPct(null);
    try {
      const now = Date.now();
      const vidUrl = await uploadFile(
        `videos/${now}-${videoFile.name}`,
        videoFile,
        (p) => setUploadPct(p.pct)
      );

      let thumbUrl: string | undefined;
      if (thumbFile) {
        thumbUrl = await uploadFile(`video-thumbs/${now}-${thumbFile.name}`, thumbFile, (p) => setUploadPct(p.pct));
      }

      await adminCreateVideo({
        title: title.trim(),
        description: description.trim(),
        url: vidUrl,
        thumbUrl,
        visible,
        createdAt: (await import("firebase/firestore")).serverTimestamp()
      });

      setTitle("");
      setDescription("");
      setVideoFile(null);
      setThumbFile(null);
      setToast({ open: true, text: "Video created.", kind: "ok" });
    } catch (err: any) {
      setToast({ open: true, text: err?.message ?? "Create failed.", kind: "err" });
    } finally {
      setBusy(false);
      setUploadPct(null);
    }
  }

  async function toggleVisibility(id: string, v: boolean) {
    try {
      await adminUpdateVideo(id, { visible: v });
    } catch {
      setToast({ open: true, text: "Update failed.", kind: "err" });
    }
  }

  async function del(id: string) {
    if (!confirm("Delete this video document? (Files in Storage remain unless you remove them manually)")) return;
    try {
      await adminDeleteVideo(id);
      setToast({ open: true, text: "Deleted.", kind: "ok" });
    } catch {
      setToast({ open: true, text: "Delete failed.", kind: "err" });
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card p-6">
        <div className="text-sm font-extrabold">Add video</div>
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
              <div className="label">Video file (MP4 recommended)</div>
              <input
                className="input"
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div>
              <div className="label">Thumbnail (optional)</div>
              <input
                className="input"
                type="file"
                accept="image/*"
                onChange={(e) => setThumbFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
            Visible to public
          </label>

          {uploadPct != null ? <div className="text-xs text-slate-300">Uploading… {uploadPct}%</div> : null}

          <button className="btn-primary w-full" disabled={!canSubmit || busy} onClick={create}>
            {busy ? "Creating…" : "Create video"}
          </button>

          <div className="text-xs text-slate-400">
            Free storage: Firebase Storage has a free tier. Keep videos optimized (H.264, 720p/1080p) to reduce bandwidth.
          </div>
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
                  <div>
                    <div className="font-bold">{r.title}</div>
                    <div className="text-sm text-slate-300 line-clamp-2">{r.description}</div>
                    <div className="mt-2 flex gap-2">
                      <a className="btn-ghost px-3 py-1 text-xs" href={r.url} target="_blank" rel="noreferrer">
                        Open video
                      </a>
                      {r.thumbUrl ? (
                        <a className="btn-ghost px-3 py-1 text-xs" href={r.thumbUrl} target="_blank" rel="noreferrer">
                          Open thumb
                        </a>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                      <input
                        type="checkbox"
                        checked={r.visible}
                        onChange={(e) => toggleVisibility(r.id, e.target.checked)}
                      />
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
