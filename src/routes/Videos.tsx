import { useEffect, useMemo, useRef, useState } from "react";
import { SectionTitle } from "../components/SectionTitle";
import { Toast } from "../components/Toast";
import { extractQualityLabel, listR2Objects, type R2Object } from "../lib/r2";
import { humanizeName } from "../lib/media";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { Skeleton } from "../components/ui/Skeleton";

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
  mp4Options: VideoOption[];
  hlsMaster?: VideoOption;
};

type HlsApi = {
  loadSource: (src: string) => void;
  attachMedia: (media: HTMLMediaElement) => void;
  destroy: () => void;
  currentLevel: number;
  levels: Array<{ height?: number; name?: string }>;
  on: (event: string, handler: () => void) => void;
};

type HlsCtor = {
  new (): HlsApi;
  isSupported: () => boolean;
  Events: { MANIFEST_PARSED: string };
};

function sortQuality(options: VideoOption[]) {
  return [...options].sort((a, b) => {
    const ap = parseInt(a.label, 10);
    const bp = parseInt(b.label, 10);
    if (Number.isNaN(ap) && Number.isNaN(bp)) return 0;
    if (Number.isNaN(ap)) return -1;
    if (Number.isNaN(bp)) return 1;
    return bp - ap;
  });
}

function groupVideos(videos: R2Object[], thumbs: R2Object[]): VideoCard[] {
  const thumbByBase = new Map(thumbs.map((thumb) => [thumb.baseName, thumb.url]));
  const group = new Map<string, VideoCard>();

  for (const video of videos) {
    const id = video.baseName;
    const prev = group.get(id) ?? {
      id,
      title: humanizeName(video.baseName),
      poster: thumbByBase.get(video.baseName),
      mp4Options: []
    };

    if (video.ext === "m3u8" && video.name === "master") {
      prev.hlsMaster = { key: video.key, label: "Auto", url: video.url };
    } else {
      prev.mp4Options.push({ key: video.key, label: extractQualityLabel(video.name) ?? "Original", url: video.url });
    }

    group.set(id, prev);
  }

  return Array.from(group.values())
    .map((card) => ({ ...card, mp4Options: sortQuality(card.mp4Options) }))
    .sort((a, b) => b.title.localeCompare(a.title));
}


async function loadHlsCtor(): Promise<HlsCtor | null> {
  const maybe = (window as Window & { Hls?: HlsCtor }).Hls;
  if (maybe) return maybe;

  const existing = document.querySelector<HTMLScriptElement>('script[data-hls-cdn="1"]');
  if (existing) {
    await new Promise((resolve, reject) => {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
    }).catch(() => undefined);
    return (window as Window & { Hls?: HlsCtor }).Hls ?? null;
  }

  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/hls.js@1.5.18/dist/hls.min.js";
  script.async = true;
  script.dataset.hlsCdn = "1";
  document.head.appendChild(script);

  await new Promise((resolve, reject) => {
    script.addEventListener("load", resolve, { once: true });
    script.addEventListener("error", reject, { once: true });
  }).catch(() => undefined);

  return (window as Window & { Hls?: HlsCtor }).Hls ?? null;
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
  const [hlsLevels, setHlsLevels] = useState<Array<{ label: string; value: number }>>([]);
  const [hlsLevel, setHlsLevel] = useState(-1);
  const [toast, setToast] = useState<{ open: boolean; text: string; kind: "info" | "ok" | "err" }>({ open: false, text: "", kind: "info" });
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<HlsApi | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const [videos, thumbs] = await Promise.all([
          listR2Objects("videos/", ["mp4", "webm", "mov", "m4v", "m3u8"]),
          listR2Objects("thumbnails/", ["jpg", "jpeg", "png", "webp", "avif"])
        ]);
        if (!mounted) return;
        setItems(groupVideos(videos, thumbs));
      } catch {
        if (!mounted) return;
        setToast({ open: true, text: "Video list unavailable.", kind: "err" });
      } finally {
        if (mounted && !silent) setLoading(false);
      }
    };

    load();
    const interval = window.setInterval(() => load(true), 60_000);
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

  const hasNativeHls = !!document.createElement("video").canPlayType("application/vnd.apple.mpegurl");

  useEffect(() => {
    if (!activeCard) return;
    setSelectedUrl(activeCard.hlsMaster?.url ?? activeCard.mp4Options[0]?.url ?? "");
    setHlsLevels([]);
    setHlsLevel(-1);
  }, [activeCard?.id]);

  useEffect(() => {
    const player = videoRef.current;
    if (!player || !activeCard || !selectedUrl) return;

    player.playbackRate = playbackRate;
    const saved = localStorage.getItem(resumeKey(activeCard.id));
    const savedTime = saved ? parseFloat(saved) : 0;

    const restore = () => {
      if (savedTime > 0 && Number.isFinite(savedTime)) player.currentTime = savedTime;
    };

    const setupHls = async () => {
      const isHls = selectedUrl.endsWith(".m3u8");
      hlsRef.current?.destroy();
      hlsRef.current = null;

      if (!isHls) {
        player.src = selectedUrl;
        player.addEventListener("loadedmetadata", restore, { once: true });
        return;
      }

      if (hasNativeHls) {
        player.src = selectedUrl;
        player.addEventListener("loadedmetadata", restore, { once: true });
        return;
      }

      const Hls = await loadHlsCtor();
      if (!Hls || !Hls.isSupported()) {
        player.src = selectedUrl;
        player.addEventListener("loadedmetadata", restore, { once: true });
        return;
      }

      const instance = new Hls();
      hlsRef.current = instance;
      instance.loadSource(selectedUrl);
      instance.attachMedia(player);
      instance.on(Hls.Events.MANIFEST_PARSED, () => {
        setHlsLevels([
          { label: "Auto", value: -1 },
          ...instance.levels.map((level, index) => ({ label: `${level.height ?? "HD"}p`, value: index }))
        ]);
      });
      player.addEventListener("loadedmetadata", restore, { once: true });
    };

    setupHls().catch(() => setToast({ open: true, text: "Unable to start selected stream.", kind: "err" }));

    return () => {
      player.removeEventListener("loadedmetadata", restore);
    };
  }, [activeCard?.id, selectedUrl, playbackRate, hasNativeHls]);

  useEffect(() => {
    if (!hlsRef.current) return;
    hlsRef.current.currentLevel = hlsLevel;
  }, [hlsLevel]);

  useEffect(() => {
    if (!activeCard) return;
    const onKey = (event: KeyboardEvent) => {
      const player = videoRef.current;
      if (!player) return;
      if (event.key === "Escape") setActiveId(null);
      if (event.key === " ") {
        event.preventDefault();
        if (player.paused) player.play().catch(() => undefined);
        else player.pause();
      }
      if (event.key === "ArrowRight") player.currentTime += 5;
      if (event.key === "ArrowLeft") player.currentTime -= 5;
      if (event.key.toLowerCase() === "m") player.muted = !player.muted;
      if (event.key.toLowerCase() === "f") {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
        else player.requestFullscreen().catch(() => undefined);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeCard]);

  useEffect(() => {
    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, []);

  const requestPiP = async () => {
    const player = videoRef.current;
    if (!player || !document.pictureInPictureEnabled) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await player.requestPictureInPicture();
    } catch {
      setToast({ open: true, text: "Picture-in-picture is unavailable.", kind: "info" });
    }
  };

  return (
    <div className="shell section-gap">
      <SectionTitle
        title="Films"
        subtitle="Motion studies presented with theater playback controls."
        right={<Input className="w-full md:w-80" placeholder="Search films" value={q} onChange={(e) => setQ(e.target.value)} />}
      />

      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Card key={n} className="overflow-hidden p-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="mt-3 h-5 w-2/3" />
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-slate-300">No films yet.</Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((video) => (
            <button key={video.id} type="button" className="text-left" onClick={() => setActiveId(video.id)}>
              <Card className="group overflow-hidden">
                {video.poster ? <img src={video.poster} alt={video.title} className="h-48 w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" /> : <Skeleton className="h-48 w-full" />}
                <div className="space-y-1 p-4">
                  <h3 className="text-lg font-medium">{video.title}</h3>
                  <p className="text-sm text-slate-400">
                    {video.hlsMaster || video.mp4Options.length > 1 ? "Multiple qualities" : "Quality: Original"}
                  </p>
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}

      <Modal open={!!activeCard} title="Theater player" onClose={() => setActiveId(null)} className="max-w-6xl">
        {activeCard ? (
          <div className="flex h-[90vh] flex-col gap-3 p-4 md:p-6">
            <h3 className="pr-20 text-xl font-medium">{activeCard.title}</h3>
            <video
              ref={videoRef}
              key={selectedUrl}
              className="h-full min-h-[260px] w-full flex-1 rounded-3xl border border-white/10 bg-black"
              controls
              playsInline
              preload="metadata"
              poster={activeCard.poster}
              onTimeUpdate={(e) => localStorage.setItem(resumeKey(activeCard.id), String(e.currentTarget.currentTime))}
            />

            <div className="flex flex-wrap items-center gap-3">
              {activeCard.mp4Options.length > 1 && !selectedUrl.endsWith(".m3u8") ? (
                <>
                  <label className="label" htmlFor="quality">Quality</label>
                  <select id="quality" className="input h-10 w-auto" value={selectedUrl} onChange={(e) => setSelectedUrl(e.target.value)}>
                    {activeCard.mp4Options.map((option) => <option key={option.key} value={option.url}>{option.label}</option>)}
                  </select>
                </>
              ) : null}

              {hlsLevels.length > 1 ? (
                <>
                  <label className="label" htmlFor="hls-quality">Quality</label>
                  <select id="hls-quality" className="input h-10 w-auto" value={hlsLevel} onChange={(e) => setHlsLevel(Number(e.target.value))}>
                    {hlsLevels.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}
                  </select>
                </>
              ) : null}

              {activeCard.mp4Options.length <= 1 && !activeCard.hlsMaster ? <p className="text-sm text-slate-300">Quality: Original</p> : null}

              <label className="label" htmlFor="speed">Speed</label>
              <select id="speed" className="input h-10 w-auto" value={playbackRate} onChange={(e) => setPlaybackRate(Number(e.target.value))}>
                {speedOptions.map((speed) => <option key={speed} value={speed}>{speed}x</option>)}
              </select>

              <button type="button" className="btn btn-ghost" onClick={requestPiP}>PiP</button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Toast open={toast.open} text={toast.text} kind={toast.kind} onClose={() => setToast((t) => ({ ...t, open: false }))} />
    </div>
  );
}
