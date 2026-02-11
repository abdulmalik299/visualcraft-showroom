import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getModelById } from "../lib/firestore";
import type { ModelDoc } from "../lib/types";
import { moneyUSD } from "../lib/utils";
import { Toast } from "../components/Toast";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": any;
    }
  }
}

type Row = { id: string } & ModelDoc;

export function ModelDetails() {
  const { id } = useParams();
  const [item, setItem] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ open: boolean; text: string; kind: "info" | "ok" | "err" }>({
    open: false,
    text: "",
    kind: "info"
  });

  useEffect(() => {
    (async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const row = await getModelById(id);
        if (!row) {
          setToast({ open: true, text: "Model not found (or not visible).", kind: "err" });
          return;
        }
        setItem(row);
      } catch {
        setToast({ open: true, text: "Failed to load model.", kind: "err" });
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const payLinks = useMemo(() => {
    if (!item) return [];
    return [
      item.stripeLink ? { label: "Pay with Card (Stripe)", href: item.stripeLink } : null,
      item.paypalLink ? { label: "Pay with PayPal", href: item.paypalLink } : null,
      item.payoneerLink ? { label: "Pay with Payoneer", href: item.payoneerLink } : null
    ].filter(Boolean) as Array<{ label: string; href: string }>;
  }, [item]);

  if (loading) {
    return (
      <div className="container-pad py-10">
        <div className="card p-8 text-slate-300">Loading model…</div>
      </div>
    );
  }

  if (!item || item.kind !== "3d" || !item.fileUrl) {
    return (
      <div className="container-pad py-10">
        <div className="card p-8 text-slate-300">
          This item is unavailable for 3D preview. It may be hidden, deleted, or published as an image product.
        </div>
        <div className="mt-4">
          <Link to="/store" className="btn-primary">Back to Store</Link>
        </div>
        <Toast open={toast.open} text={toast.text} kind={toast.kind} onClose={() => setToast((t) => ({ ...t, open: false }))} />
      </div>
    );
  }

  return (
    <div className="container-pad py-10">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link to="/store" className="btn-ghost">← Back to Store</Link>
        <div className="badge">{item.isFree ? "FREE" : moneyUSD(item.priceUSD) || "PAID"}</div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-4">
          <div className="text-sm font-extrabold">3D Preview</div>
          <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/30">
            <model-viewer
              src={item.fileUrl}
              poster={item.posterUrl}
              camera-controls
              touch-action="pan-y"
              auto-rotate
              rotation-per-second="20deg"
              exposure="1.0"
              shadow-intensity="0.8"
              environment-image="neutral"
              style={{ width: "100%", height: "440px" }}
              alt={item.title}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
            <span className="badge">Orbit + Zoom</span>
            <span className="badge">Poster fallback</span>
            <span className="badge">Neutral lighting</span>
            <span className="badge">Mobile-friendly</span>
          </div>
        </div>

        <div className="card p-6">
          <h1 className="text-2xl font-extrabold">{item.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="badge">{item.category}</span>
            {(item.tags ?? []).slice(0, 12).map((t) => (
              <span key={t} className="badge">#{t}</span>
            ))}
          </div>

          <p className="mt-4 whitespace-pre-line text-sm text-slate-300">{item.description}</p>

          <div className="mt-6 grid gap-3">
            {item.isFree ? (
              <a className="btn-primary w-full" href={item.fileUrl} download target="_blank" rel="noreferrer">
                Download Free Model
              </a>
            ) : payLinks.length > 0 ? (
              <>
                <div className="label">Payment options</div>
                <div className="grid gap-2">
                  {payLinks.map((l) => (
                    <a key={l.href} className="btn-primary w-full" href={l.href} target="_blank" rel="noreferrer">
                      {l.label}
                    </a>
                  ))}
                </div>
                <div className="text-xs text-slate-400">
                  After successful payment, send receipt confirmation to receive the download link. Upgrade later to
                  Cloud Functions for automatic delivery.
                </div>
              </>
            ) : (
              <div className="card border-rose-400/20 bg-rose-500/5 p-4 text-sm text-slate-200">
                This model is marked as paid but no payment link is configured yet. Add Stripe/PayPal/Payoneer links from Admin.
              </div>
            )}
          </div>

          <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-bold">License notes</div>
            <p className="mt-1 text-sm text-slate-300">
              Add your license text here (personal/commercial use, attribution, redistribution rules, etc.).
            </p>
          </div>
        </div>
      </div>

      <Toast open={toast.open} text={toast.text} kind={toast.kind} onClose={() => setToast((t) => ({ ...t, open: false }))} />
    </div>
  );
}
