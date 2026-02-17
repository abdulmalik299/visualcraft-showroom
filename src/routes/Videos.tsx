import { useEffect, useMemo, useRef, useState } from "react";
import { SectionTitle } from "../components/SectionTitle";
import { type R2Object } from "../lib/r2";
import { humanizeName } from "../lib/media";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { Skeleton } from "../components/ui/Skeleton";
import { ChevronLeftIcon, ChevronRightIcon, ExpandIcon, PauseIcon, PipIcon, PlayIcon, VolumeIcon } from "../components/icons";
import { useR2Listing } from "../hooks/useR2Listing";

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

function formatTime(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds)) return "00:00";
  const total = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const resumeKey = (id: string) => `video-resume:${id}`;

export function Videos() {
  const videosListing = useR2Listing("videos/", ["mp4", "webm", "mov", "m4v", "m3u8"]);
  const thumbsListing = useR2Listing("thumbnails/", ["jpg", "jpeg", "png", "webp", "avif"]);

  const [q, setQ] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [resumeAt, setResumeAt] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hideControlsTimer = useRef<number | null>(null);

  const items = useMemo(() => groupVideos(videosListing.items, thumbsListing.items), [videosListing.items, thumbsListing.items]);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((video) => video.title.toLowerCase().includes(s));
  }, [items, q]);
  const activeIndex = filtered.findIndex((item) => item.id === activeId);
  const activeCard = activeIndex > -1 ? filtered[activeIndex] : null;

  useEffect(() => {
    const player = videoRef.current;
    if (!player || !activeCard) return;
    player.src = activeCard.sourceUrl;
    const saved = parseFloat(localStorage.getItem(resumeKey(activeCard.id)) ?? "0");
    setResumeAt(Number.isFinite(saved) ? saved : 0);

    const onLoaded = () => {
      setDuration(player.duration || 0);
      if (saved > 0 && saved < player.duration - 4) player.currentTime = saved;
    };
    const onTime = () => {
      setProgress(player.currentTime);
      localStorage.setItem(resumeKey(activeCard.id), `${player.currentTime}`);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    player.addEventListener("loadedmetadata", onLoaded);
    player.addEventListener("timeupdate", onTime);
    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    player.play().catch(() => undefined);

    return () => {
      player.removeEventListener("loadedmetadata", onLoaded);
      player.removeEventListener("timeupdate", onTime);
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
    };
  }, [activeCard?.id]);

  useEffect(() => {
    if (!activeCard) return;
    const onKey = (event: KeyboardEvent) => {
      const player = videoRef.current;
      if (!player) return;
      if (event.key === "Escape") setActiveId(null);
      if (event.key === " ") { event.preventDefault(); player.paused ? player.play().catch(() => undefined) : player.pause(); }
      if (event.key === "ArrowRight") player.currentTime += 5;
      if (event.key === "ArrowLeft") player.currentTime -= 5;
      if (event.key.toLowerCase() === "m") { player.muted = !player.muted; setMuted(player.muted); }
      if (event.key.toLowerCase() === "f") player.requestFullscreen().catch(() => undefined);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeCard?.id]);

  const showControls = () => {
    setControlsVisible(true);
    if (hideControlsTimer.current) window.clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = window.setTimeout(() => playing && setControlsVisible(false), 1800);
  };

  return (
    <div className="shell section-gap">
      <SectionTitle title="Films" subtitle="Modern playback with keyboard controls and resume memory." right={<Input id="video-search" name="video-search" className="w-full md:w-80" placeholder="Search films" value={q} onChange={(e) => setQ(e.target.value)} />} />

      {videosListing.loading ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((n) => <Card key={n} className="overflow-hidden p-4"><Skeleton className="h-48 w-full" /><Skeleton className="mt-3 h-5 w-2/3" /></Card>)}</div>
      ) : videosListing.error ? (
        <Card className="p-8 text-slate-300"><p>Films are unavailable right now.</p><button className="btn btn-ghost mt-3" onClick={() => videosListing.revalidate()}>Retry</button></Card>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-slate-300">No films yet.</Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((video) => (
            <button key={video.id} type="button" className="text-left" onClick={() => setActiveId(video.id)}>
              <Card className="group overflow-hidden" interactive>
                {video.poster ? <img src={video.poster} alt={video.title} className="video-poster h-52 w-full object-cover" loading="lazy" /> : <div className="h-52 w-full bg-white/5" />}
                <div className="space-y-1 p-4"><h3 className="text-lg font-medium">{video.title}</h3><p className="text-sm text-slate-400">Open player</p></div>
              </Card>
            </button>
          ))}
        </div>
      )}

      <Modal open={!!activeCard} title="Theater player" onClose={() => setActiveId(null)} className="max-w-6xl">
        {activeCard ? (
          <div className="flex h-[90vh] flex-col gap-3 p-4 md:p-6">
            <div className="flex items-center justify-between pr-20">
              <h3 className="text-xl font-medium">{activeCard.title}</h3>
              {resumeAt > 4 ? <button className="chip chip-idle" onClick={() => { if (videoRef.current) videoRef.current.currentTime = resumeAt; }}>Resume from {formatTime(resumeAt)}</button> : null}
            </div>
            <div className="relative flex-1 overflow-hidden rounded-3xl border border-white/10 bg-black" onMouseMove={showControls} onMouseLeave={() => playing && setControlsVisible(false)} onTouchStart={showControls}>
              <video ref={videoRef} className="h-full min-h-[260px] w-full" playsInline preload="metadata" poster={activeCard.poster} onClick={() => {
                const player = videoRef.current;
                if (!player) return;
                player.paused ? player.play().catch(() => undefined) : player.pause();
              }} />

              <div className={controlsVisible ? "video-controls-overlay is-visible" : "video-controls-overlay"}>
                <div className="relative h-2 rounded-full bg-white/20">
                  <div className="absolute inset-y-0 left-0 rounded-full bg-indigo-300" style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }} />
                  <input type="range" min={0} max={duration || 0} value={progress} onChange={(e) => {
                    const player = videoRef.current;
                    if (!player) return;
                    player.currentTime = Number(e.target.value);
                    setProgress(Number(e.target.value));
                  }} className="absolute inset-0 h-2 w-full cursor-pointer opacity-0" />
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button className="icon-btn" onClick={() => { const p = videoRef.current; if (!p) return; p.paused ? p.play().catch(() => undefined) : p.pause(); }} aria-label={playing ? "Pause" : "Play"}>{playing ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}</button>
                    <button className="icon-btn" onClick={() => { if (videoRef.current) videoRef.current.currentTime -= 5; }} aria-label="Back 5 seconds"><ChevronLeftIcon className="h-4 w-4" /></button>
                    <button className="icon-btn" onClick={() => { if (videoRef.current) videoRef.current.currentTime += 5; }} aria-label="Forward 5 seconds"><ChevronRightIcon className="h-4 w-4" /></button>
                    <button className="icon-btn" onClick={() => { const p = videoRef.current; if (!p) return; p.muted = !p.muted; setMuted(p.muted); }} aria-label="Mute"><VolumeIcon className="h-4 w-4" />{muted ? <span className="sr-only">Muted</span> : null}</button>
                    <button className="icon-btn" onClick={() => videoRef.current?.requestPictureInPicture?.().catch(() => undefined)} aria-label="Picture in Picture"><PipIcon className="h-4 w-4" /></button>
                    <button className="icon-btn" onClick={() => videoRef.current?.requestFullscreen().catch(() => undefined)} aria-label="Fullscreen"><ExpandIcon className="h-4 w-4" /></button>
                  </div>
                  <p className="text-sm text-slate-200">{formatTime(progress)} / {formatTime(duration)}</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
