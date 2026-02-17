import { useEffect, useMemo, useRef, useState } from "react";
import { SectionTitle } from "../components/SectionTitle";
import { Toast } from "../components/Toast";
import { type R2Object } from "../lib/r2";
import { humanizeName } from "../lib/media";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { Skeleton } from "../components/ui/Skeleton";
import { ExpandIcon, PauseIcon, PlayIcon, VolumeIcon } from "../components/icons";
import { useR2Listing } from "../hooks/useR2Listing";

const speedOptions = [0.5, 1, 1.25, 1.5, 2];

type VideoCard = { id: string; title: string; poster?: string; sourceUrl: string };

function groupVideos(videos: R2Object[], thumbs: R2Object[]): VideoCard[] {
  const thumbByBase = new Map(thumbs.map((thumb) => [thumb.baseName, thumb.url]));
  const group = new Map<string, VideoCard>();
  for (const video of videos) {
    if (video.ext === "m3u8") continue;
    const prev = group.get(video.baseName);
    if (!prev || video.url.includes("_1080p") || !prev.sourceUrl.includes("_1080p")) {
      group.set(video.baseName, { id: video.baseName, title: humanizeName(video.baseName), poster: thumbByBase.get(video.baseName), sourceUrl: video.url });
    }
  }
  return Array.from(group.values()).sort((a, b) => b.title.localeCompare(a.title));
}

function resumeKey(id: string) {
  return `video-resume:${id}`;
}

function formatTime(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds)) return "00:00";
  const total = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function Videos() {
  const { items: videoItems, loading } = useR2Listing("videos/", ["mp4", "webm", "mov", "m4v", "m3u8"]);
  const { items: thumbs } = useR2Listing("thumbnails/", ["jpg", "jpeg", "png", "webp", "avif"]);

  const [q, setQ] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [canPlay, setCanPlay] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [toast, setToast] = useState<{ open: boolean; text: string; kind: "info" | "ok" | "err" }>({ open: false, text: "", kind: "info" });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hideControlsTimer = useRef<number | null>(null);
  const resumeWriteTimer = useRef<number | null>(null);

  const items = useMemo(() => groupVideos(videoItems, thumbs), [videoItems, thumbs]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((video) => video.title.toLowerCase().includes(s));
  }, [items, q]);

  const activeCard = useMemo(() => filtered.find((item) => item.id === activeId) ?? null, [activeId, filtered]);

  useEffect(() => {
    const player = videoRef.current;
    if (!player || !activeCard) return;

    setCanPlay(false);
    setProgress(0);
    setBuffered(0);
    setIsBuffering(true);
    player.src = activeCard.sourceUrl;
    player.playbackRate = playbackRate;

    const saved = localStorage.getItem(resumeKey(activeCard.id));
    const at = saved ? parseFloat(saved) : 0;

    const onLoaded = () => {
      setDuration(player.duration || 0);
      if (Number.isFinite(at) && at > 0 && at < player.duration) player.currentTime = at;
    };
    const onCanPlay = () => {
      setCanPlay(true);
      setIsBuffering(false);
    };
    const onTime = () => {
      setProgress(player.currentTime);
      const end = player.buffered.length > 0 ? player.buffered.end(player.buffered.length - 1) : 0;
      setBuffered(end);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => setIsBuffering(false);

    player.addEventListener("loadedmetadata", onLoaded);
    player.addEventListener("canplay", onCanPlay);
    player.addEventListener("timeupdate", onTime);
    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    player.addEventListener("waiting", onWaiting);
    player.addEventListener("playing", onPlaying);

    player.play().catch(() => undefined);

    return () => {
      player.removeEventListener("loadedmetadata", onLoaded);
      player.removeEventListener("canplay", onCanPlay);
      player.removeEventListener("timeupdate", onTime);
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
      player.removeEventListener("waiting", onWaiting);
      player.removeEventListener("playing", onPlaying);
    };
  }, [activeCard?.id, playbackRate]);

  useEffect(() => {
    if (!activeCard) return;
    resumeWriteTimer.current = window.setInterval(() => {
      const player = videoRef.current;
      if (!player) return;
      localStorage.setItem(resumeKey(activeCard.id), `${player.currentTime}`);
    }, 3000);
    return () => {
      if (resumeWriteTimer.current) window.clearInterval(resumeWriteTimer.current);
    };
  }, [activeCard?.id]);

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
      if (event.key === "ArrowRight") player.currentTime += 10;
      if (event.key === "ArrowLeft") player.currentTime -= 10;
      if (event.key.toLowerCase() === "m") {
        player.muted = !player.muted;
        setMuted(player.muted);
      }
      if (event.key.toLowerCase() === "f") player.requestFullscreen().catch(() => undefined);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeCard]);

  const showControls = () => {
    setControlsVisible(true);
    if (hideControlsTimer.current) window.clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = window.setTimeout(() => {
      if (playing) setControlsVisible(false);
    }, 2200);
  };

  const cycleSpeed = () => {
    const idx = speedOptions.findIndex((speed) => speed === playbackRate);
    const next = speedOptions[(idx + 1) % speedOptions.length];
    setPlaybackRate(next);
    if (videoRef.current) videoRef.current.playbackRate = next;
  };

  return (
    <div className="shell section-gap">
      <SectionTitle
        title="Films"
        subtitle="Cinematic cards with modern in-player playback controls."
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
                {video.poster ? <img src={video.poster} alt={video.title} className="video-poster h-52 w-full object-cover" loading="lazy" /> : <Skeleton className="h-52 w-full" />}
                <div className="space-y-1 p-4"><h3 className="text-lg font-medium">{video.title}</h3><p className="text-sm text-slate-400">Theater playback</p></div>
              </Card>
            </button>
          ))}
        </div>
      )}

      <Modal open={!!activeCard} title="Theater player" onClose={() => setActiveId(null)} className="max-w-6xl">
        {activeCard ? (
          <div className="flex h-[90vh] flex-col gap-3 p-4 md:p-6">
            <h3 className="pr-20 text-xl font-medium">{activeCard.title}</h3>
            <div
              className="relative flex-1 overflow-hidden rounded-3xl border border-white/10 bg-black"
              onMouseMove={showControls}
              onMouseLeave={() => playing && setControlsVisible(false)}
              onTouchStart={showControls}
            >
              <video ref={videoRef} className="h-full min-h-[260px] w-full" playsInline preload="metadata" poster={activeCard.poster} onClick={() => {
                const player = videoRef.current;
                if (!player) return;
                if (player.paused) player.play().catch(() => undefined);
                else player.pause();
              }} />

              {!canPlay || isBuffering ? <div className="absolute inset-0 grid place-items-center bg-black/30"><div className="loader-spin h-10 w-10 rounded-full border-2 border-white/20 border-t-white" /></div> : null}

              <div className={controlsVisible ? "video-controls-overlay is-visible" : "video-controls-overlay"}>
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

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button type="button" className="icon-btn" onClick={() => {
                      const player = videoRef.current;
                      if (!player) return;
                      if (player.paused) player.play().catch(() => undefined);
                      else player.pause();
                    }} aria-label={playing ? "Pause" : "Play"}>{playing ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}</button>
                    <button type="button" className="icon-btn" onClick={() => { if (videoRef.current) videoRef.current.currentTime -= 10; }} aria-label="Rewind 10 seconds">-10</button>
                    <button type="button" className="icon-btn" onClick={() => { if (videoRef.current) videoRef.current.currentTime += 10; }} aria-label="Forward 10 seconds">+10</button>
                    <button type="button" className="icon-btn" onClick={() => {
                      const player = videoRef.current;
                      if (!player) return;
                      player.muted = !player.muted;
                      setMuted(player.muted);
                    }} aria-label="Mute"><VolumeIcon className="h-4 w-4" />{muted ? <span className="sr-only">Muted</span> : null}</button>
                    <button type="button" className="icon-btn" onClick={() => videoRef.current?.requestFullscreen().catch(() => undefined)} aria-label="Fullscreen"><ExpandIcon className="h-4 w-4" /></button>
                    <button type="button" className="btn btn-ghost px-3 py-1" onClick={cycleSpeed}>{playbackRate}x</button>
                  </div>
                  <p className="text-sm text-slate-200">{formatTime(progress)} / {formatTime(duration)}</p>
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
