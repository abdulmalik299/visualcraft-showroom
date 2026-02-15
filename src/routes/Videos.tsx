import React, { useEffect, useMemo, useState } from "react";
import { SectionTitle } from "../components/SectionTitle";
import { Toast } from "../components/Toast";
import { extractQualityLabel, listR2Objects, type R2Object } from "../lib/r2";

type VideoOption = {
  key: string;
  label: string;
  url: string;
};

type VideoCard = {
  id: string;
  title: string;
  poster?: string;
  options: VideoOption[];
};

function groupVideos(videos: R2Object[], thumbs: R2Object[]): VideoCard[] {
  const thumbByBase = new Map(thumbs.map((thumb) => [thumb.baseName, thumb.url]));
  const group = new Map<string, VideoCard>();

  for (const video of videos) {
    const quality = extractQualityLabel(video.name);
    const id = video.baseName;
    const prev = group.get(id);

    const nextOption: VideoOption = {
      key: video.key,
      label: quality ?? "Original",
      url: video.url
    };

    if (!prev) {
      group.set(id, {
        id,
        title: video.baseName,
        poster: thumbByBase.get(video.baseName),
        options: [nextOption]
      });
      continue;
    }

    prev.options.push(nextOption);
  }

  return Array.from(group.values())
    .map((card) => ({
      ...card,
      options: card.options.sort((a, b) => {
        const ap = parseInt(a.label, 10);
        const bp = parseInt(b.label, 10);
        if (Number.isNaN(ap) && Number.isNaN(bp)) return 0;
        if (Number.isNaN(ap)) return -1;
        if (Number.isNaN(bp)) return 1;
        return bp - ap;
      })
    }))
    .sort((a, b) => b.title.localeCompare(a.title));
}

function VideoPlayer({ card }: { card: VideoCard }) {
  const [selectedUrl, setSelectedUrl] = useState(card.options[0]?.url ?? "");

  useEffect(() => {
    setSelectedUrl(card.options[0]?.url ?? "");
  }, [card.id, card.options]);

  return (
    <article className="card overflow-hidden">
      {card.poster ? (
        <img src={card.poster} alt={card.title} className="h-52 w-full object-cover" loading="lazy" decoding="async" />
      ) : (
        <div className="h-52 w-full bg-white/5" />
      )}

      <div className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-extrabold">{card.title}</h3>
          {card.options.length > 1 ? (
            <select
              className="input w-auto"
              value={selectedUrl}
              onChange={(e) => setSelectedUrl(e.target.value)}
              aria-label={`Select ${card.title} quality`}
            >
              {card.options.map((option) => (
                <option key={option.key} value={option.url}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : null}
        </div>

        <div className="mt-4">
          <video
            key={selectedUrl}
            className="w-full rounded-xl border border-white/10 bg-black/30"
            controls
            controlsList="nodownload noplaybackrate"
            playsInline
            preload="metadata"
            poster={card.poster}
            src={selectedUrl}
          />
        </div>
      </div>
    </article>
  );
}

export function Videos() {
  const [items, setItems] = useState<VideoCard[]>([]);
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
        const [videos, thumbs] = await Promise.all([
          listR2Objects("videos/", ["mp4", "webm", "mov", "m4v"]),
          listR2Objects("thumbnails/", ["jpg", "jpeg", "png", "webp", "avif"])
        ]);

        if (!mounted) return;
        setItems(groupVideos(videos, thumbs));
      } catch {
        if (!mounted) return;
        setToast({ open: true, text: "Failed to load videos from Cloudflare R2.", kind: "err" });
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
    return items.filter((video) => video.title.toLowerCase().includes(s));
  }, [items, q]);

  return (
    <div className="container-pad py-10">
      <SectionTitle
        title="Videos"
        subtitle="Live from Cloudflare R2: videos/ + thumbnails/"
        right={<input className="input w-full md:w-80" placeholder="Search videos…" value={q} onChange={(e) => setQ(e.target.value)} />}
      />

      {loading ? (
        <div className="grid gap-5 md:grid-cols-2">
          {[0, 1].map((n) => (
            <article key={n} className="card overflow-hidden p-5">
              <div className="h-52 animate-pulse rounded-xl bg-white/10" />
              <div className="mt-4 h-5 w-1/2 animate-pulse rounded bg-white/10" />
              <div className="mt-2 h-3 w-full animate-pulse rounded bg-white/10" />
            </article>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-slate-300">No videos found in the R2 bucket under <span className="badge">videos/</span>.</div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {filtered.map((video) => (
            <VideoPlayer key={video.id} card={video} />
          ))}
        </div>
      )}

      <Toast open={toast.open} text={toast.text} kind={toast.kind} onClose={() => setToast((t) => ({ ...t, open: false }))} />
    </div>
  );
}
