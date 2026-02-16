import React, { useEffect, useMemo, useRef, useState } from "react";
import { SectionTitle } from "../components/SectionTitle";
import { Toast } from "../components/Toast";
import { extractQualityLabel, listR2Objects, type R2Object } from "../lib/r2";
import { humanizeName } from "../lib/media";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";

const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];

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
        title: humanizeName(video.baseName),
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

function resumeKey(id: string) {
  return `video-resume:${id}`;
}

export function Videos() {
  const [items, setItems] = useState<VideoCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedUrl, setSelectedUrl] = useState("");
  const [playbackRate, setPlaybackRate] = useState(1);
  const videoRef = useRef<HTMLVideoElement | null>(null);
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
        setToast({ open: true, text: "Failed to load videos.", kind: "err" });
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

  const activeCard = useMemo(() => filtered.find((item) => item.id === activeId) ?? null, [activeId, filtered]);

  useEffect(() => {
    if (!activeCard) return;
    setSelectedUrl(activeCard.options[0]?.url ?? "");
  }, [activeCard?.id]);

  useEffect(() => {
    if (!activeCard || !videoRef.current) return;
    const player = videoRef.current;
    player.playbackRate = playbackRate;

    const saved = localStorage.getItem(resumeKey(activeCard.id));
    const savedTime = saved ? parseFloat(saved) : 0;
    if (savedTime > 0) {
      const onLoaded = () => {
        player.currentTime = savedTime;
      };
      player.addEventListener("loadedmetadata", onLoaded, { once: true });
      return () => player.removeEventListener("loadedmetadata", onLoaded);
    }

    return undefined;
  }, [activeCard?.id, selectedUrl, playbackRate]);

  useEffect(() => {
    if (!activeCard) return;
    const onKey = (event: KeyboardEvent) => {
      const player = videoRef.current;
      if (!player) return;

      if (event.key === "Escape") setActiveId(null);
      if (event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (player.paused) {
          player.play().catch(() => undefined);
        } else {
          player.pause();
        }
      }
      if (event.key === "ArrowRight") player.currentTime += 5;
      if (event.key === "ArrowLeft") player.currentTime -= 5;
      if (event.key.toLowerCase() === "m") player.muted = !player.muted;
      if (event.key === ">" || event.key === ".") setPlaybackRate((r) => Math.min(2, r + 0.25));
      if (event.key === "<" || event.key === ",") setPlaybackRate((r) => Math.max(0.5, r - 0.25));
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeCard]);

  const requestPiP = async () => {
    const player = videoRef.current;
    if (!player || !document.pictureInPictureEnabled) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await player.requestPictureInPicture();
      }
    } catch {
      setToast({ open: true, text: "Picture-in-picture is unavailable on this browser.", kind: "info" });
    }
  };

  return (
    <div className="container-pad py-10">
      <SectionTitle
        title="Videos"
        subtitle="Stories in motion with selectable quality and smooth playback controls."
        right={<Input className="w-full md:w-80" placeholder="Search videos…" value={q} onChange={(e) => setQ(e.target.value)} />}
      />

      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <Card key={n} className="overflow-hidden p-5">
              <div className="h-44 animate-pulse rounded-xl bg-white/10" />
              <div className="mt-4 h-5 w-1/2 animate-pulse rounded bg-white/10" />
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-slate-300">No videos found yet.</Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((video) => (
            <button
              key={video.id}
              type="button"
              className="text-left"
              onClick={() => setActiveId(video.id)}
              aria-label={`Open ${video.title}`}
            >
              <Card className="overflow-hidden transition hover:-translate-y-0.5 hover:border-white/30">
                {video.poster ? (
                  <img src={video.poster} alt={video.title} className="h-44 w-full object-cover" loading="lazy" decoding="async" />
                ) : (
                  <div className="h-44 w-full bg-white/5" />
                )}
                <div className="p-4">
                  <h3 className="text-lg font-semibold">{video.title}</h3>
                  <p className="mt-1 text-sm text-slate-400">Quality: {video.options.map((item) => item.label).join(" · ")}</p>
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}

      {activeCard ? (
        <div className="fixed inset-0 z-[60] bg-black/85 p-4" role="dialog" aria-modal="true" aria-label="Video theater mode">
          <div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/95 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">{activeCard.title}</h3>
              <button type="button" className="btn btn-ghost" onClick={() => setActiveId(null)}>Close</button>
            </div>

            <video
              ref={videoRef}
              key={selectedUrl}
              className="h-full min-h-[260px] w-full flex-1 rounded-xl border border-white/10 bg-black"
              controls
              playsInline
              preload="metadata"
              poster={activeCard.poster}
              src={selectedUrl}
              onTimeUpdate={(e) => {
                localStorage.setItem(resumeKey(activeCard.id), String(e.currentTarget.currentTime));
              }}
            />

            <div className="flex flex-wrap items-center gap-3">
              <label className="label" htmlFor="quality">Quality</label>
              <select
                id="quality"
                className="input w-auto"
                value={selectedUrl}
                onChange={(e) => setSelectedUrl(e.target.value)}
                aria-label="Select video quality"
              >
                {activeCard.options.map((option) => (
                  <option key={option.key} value={option.url}>{option.label}</option>
                ))}
              </select>

              <label className="label" htmlFor="speed">Speed</label>
              <select
                id="speed"
                className="input w-auto"
                value={playbackRate}
                onChange={(e) => setPlaybackRate(Number(e.target.value))}
                aria-label="Select playback speed"
              >
                {speedOptions.map((speed) => (
                  <option key={speed} value={speed}>{speed}x</option>
                ))}
              </select>

              <button type="button" className="btn btn-ghost" onClick={requestPiP}>
                Picture in Picture
              </button>
            </div>

            <details className="text-xs text-slate-400">
              <summary className="cursor-pointer">Details</summary>
              <p className="mt-2 rounded-xl border border-white/10 bg-white/5 p-3 font-mono">{activeCard.options[0]?.key}</p>
            </details>
          </div>
        </div>
      ) : null}

      <Toast open={toast.open} text={toast.text} kind={toast.kind} onClose={() => setToast((t) => ({ ...t, open: false }))} />
    </div>
  );
}
