import { useEffect, useMemo, useRef, useState } from "react";
import { SectionTitle } from "../components/SectionTitle";
import { Toast } from "../components/Toast";
import { extractQualityLabel, listR2Objects, type R2Object } from "../lib/r2";
import { humanizeName } from "../lib/media";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { Skeleton } from "../components/ui/Skeleton";
import { ExpandIcon, PauseIcon, PlayIcon, VolumeIcon } from "../components/icons";

const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];

type VideoOption = { key: string; label: string; url: string };
type VideoCard = { id: string; title: string; poster?: string; mp4Options: VideoOption[]; hlsMaster?: VideoOption };

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
    const prev = group.get(id) ?? { id, title: humanizeName(video.baseName), poster: thumbByBase.get(video.baseName), mp4Options: [] };
    if (video.ext === "m3u8" && video.name === "master") prev.hlsMaster = { key: video.key, label: "Auto", url: video.url };
    else prev.mp4Options.push({ key: video.key, label: extractQualityLabel(video.name) ?? "Original", url: video.url });
    group.set(id, prev);
  }
  return Array.from(group.values()).map((card) => ({ ...card, mp4Options: sortQuality(card.mp4Options) })).sort((a, b) => b.title.localeCompare(a.title));
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
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [metaReady, setMetaReady] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; text: string; kind: "info" | "ok" | "err" }>({ open: false, text: "", kind: "info" });

  const videoRef = useRef<HTMLVideoElement | null>(null);

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
        if (mounted) setToast({ open: true, text: "Video list unavailable.", kind: "err" });
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

  useEffect(() => {
    if (!activeCard) return;
    setSelectedUrl(activeCard.mp4Options[0]?.url ?? activeCard.hlsMaster?.url ?? "");
    setMetaReady(false);
    setProgress(0);
    setBuffered(0);
  }, [activeCard?.id]);

  useEffect(() => {
    const player = videoRef.current;
    if (!player || !activeCard || !selectedUrl) return;
    player.src = selectedUrl;
    player.playbackRate = playbackRate;
    const saved = localStorage.getItem(resumeKey(activeCard.id));
    const at = saved ? parseFloat(saved) : 0;

    const onLoaded = () => {
      setMetaReady(true);
      setDuration(player.duration || 0);
      if (Number.isFinite(at) && at > 0 && at < player.duration) player.currentTime = at;
    };
    const onTime = () => {
      setProgress(player.currentTime);
      const end = player.buffered.length > 0 ? player.buffered.end(player.buffered.length - 1) : 0;
      setBuffered(end);
      localStorage.setItem(resumeKey(activeCard.id), `${player.currentTime}`);
    };

    player.addEventListener("loadedmetadata", onLoaded);
    player.addEventListener("timeupdate", onTime);
    player.addEventListener("play", () => setPlaying(true));
    player.addEventListener("pause", () => setPlaying(false));

    return () => {
      player.removeEventListener("loadedmetadata", onLoaded);
      player.removeEventListener("timeupdate", onTime);
    };
  }, [selectedUrl, activeCard?.id, playbackRate]);

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
      if (event.key.toLowerCase() === "m") {
        player.muted = !player.muted;
        setMuted(player.muted);
      }
      if (event.key.toLowerCase() === "f") {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
        else player.requestFullscreen().catch(() => undefined);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeCard]);

  const requestPiP = async () => {
    const player = videoRef.current;
    if (!player || !document.pictureInPictureEnabled) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await player.requestPictureInPicture();
    } catch {
      setToast({ open: true, text: "Picture-in-picture unavailable.", kind: "info" });
    }
  };

  const showQualityPicker = (activeCard?.mp4Options.length ?? 0) > 1;

  return (
    <div className="shell section-gap">
      <SectionTitle
        title="Films"
        subtitle="Theater playback with precision controls."
        right={<Input id="video-search" name="video-search" className="w-full md:w-80" placeholder="Search films" value={q} onChange={(e) => setQ(e.target.value)} />}
      />

      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((n) => <Card key={n} className="overflow-hidden p-4"><Skeleton className="h-48 w-full" /><Skeleton className="mt-3 h-5 w-2/3" /></Card>)}</div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-slate-300">No films yet.</Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((video) => (
            <button key={video.id} type="button" className="text-left" onClick={() => setActiveId(video.id)}>
              <Card className="group overflow-hidden" interactive>
                {video.poster ? <img src={video.poster} alt={video.title} className="h-52 w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" /> : <Skeleton className="h-52 w-full" />}
                <div className="space-y-1 p-4"><h3 className="text-lg font-medium">{video.title}</h3><p className="text-sm text-slate-400">{video.mp4Options.length > 1 ? "Multiple renditions" : "Original"}</p></div>
              </Card>
            </button>
          ))}
        </div>
      )}

      <Modal open={!!activeCard} title="Theater player" onClose={() => setActiveId(null)} className="max-w-6xl">
        {activeCard ? (
          <div className="flex h-[90vh] flex-col gap-3 p-4 md:p-6">
            <h3 className="pr-20 text-xl font-medium">{activeCard.title}</h3>
            <div className="relative flex-1 overflow-hidden rounded-3xl border border-white/10 bg-black">
              {!metaReady ? <Skeleton className="absolute inset-0 h-full w-full rounded-none bg-gradient-to-r from-white/5 via-white/15 to-white/5" /> : null}
              <video ref={videoRef} className="h-full min-h-[260px] w-full" playsInline preload="metadata" poster={activeCard.poster} />

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3">
                <div className="relative h-2 rounded-full bg-white/20">
                  <div className="absolute inset-y-0 left-0 rounded-full bg-white/30" style={{ width: `${duration ? (buffered / duration) * 100 : 0}%` }} />
                  <div className="absolute inset-y-0 left-0 rounded-full bg-indigo-300" style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }} />
                  <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    value={progress}
                    onChange={(e) => {
                      const player = videoRef.current;
                      if (!player) return;
                      player.currentTime = Number(e.target.value);
                      setProgress(Number(e.target.value));
                    }}
                    className="absolute inset-0 h-2 w-full cursor-pointer opacity-0"
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button type="button" className="icon-btn" onClick={() => {
                    const player = videoRef.current;
                    if (!player) return;
                    if (player.paused) player.play().catch(() => undefined);
                    else player.pause();
                  }} aria-label={playing ? "Pause" : "Play"}>{playing ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}</button>
                  <button type="button" className="icon-btn" onClick={() => {
                    const player = videoRef.current;
                    if (!player) return;
                    player.muted = !player.muted;
                    setMuted(player.muted);
                  }} aria-label="Mute"><VolumeIcon className="h-4 w-4" />{muted ? <span className="sr-only">Muted</span> : null}</button>
                  <button type="button" className="icon-btn" onClick={() => videoRef.current?.requestFullscreen().catch(() => undefined)} aria-label="Fullscreen"><ExpandIcon className="h-4 w-4" /></button>
                  <button type="button" className="btn btn-ghost px-3 py-1" onClick={requestPiP}>PiP</button>
                  {showQualityPicker ? <select className="input h-9 w-auto" value={selectedUrl} onChange={(e) => setSelectedUrl(e.target.value)}>{activeCard.mp4Options.map((option) => <option key={option.key} value={option.url}>{option.label}</option>)}</select> : <p className="text-sm text-slate-300">Original</p>}
                  <select id="speed" className="input h-9 w-auto" value={playbackRate} onChange={(e) => {
                    const next = Number(e.target.value);
                    setPlaybackRate(next);
                    if (videoRef.current) videoRef.current.playbackRate = next;
                  }}>
                    {speedOptions.map((speed) => <option key={speed} value={speed}>{speed}x</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      <Toast open={toast.open} text={toast.text} kind={toast.kind} onClose={() => setToast((t) => ({ ...t, open: false }))} />
    </div>
  );
}
