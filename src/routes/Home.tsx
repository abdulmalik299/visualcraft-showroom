import { Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { SectionTitle } from "../components/SectionTitle";
import { Card } from "../components/ui/Card";
import { listR2Objects, type R2Object } from "../lib/r2";
import { humanizeName } from "../lib/media";
import { HeroPortal } from "../components/artwork/HeroPortal";
import { SectionDivider } from "../components/artwork/SectionDivider";
import { ArrowIcon, FilmIcon, GalleryIcon } from "../components/icons";

const notes = ["Direction", "Texture", "Atmosphere", "Motion"];
const taglines = ["Fluid Motion Visuals", "Tactile Frame Stories", "Cinematic Product Poetry", "Modern Light Narratives"];

type FeaturedItem = {
  id: string;
  title: string;
  url: string;
  type: "image" | "video";
  poster?: string;
  category: string;
};

function buildFeatured(images: R2Object[], videos: R2Object[], thumbs: R2Object[]) {
  const posterByBase = new Map(thumbs.map((thumb) => [thumb.baseName, thumb.url]));
  const merged: Array<{ item: R2Object; type: "image" | "video" }> = [
    ...images.map((item) => ({ item, type: "image" as const })),
    ...videos.map((item) => ({ item, type: "video" as const }))
  ];

  return merged
    .sort((a, b) => {
      const at = a.item.lastModified ? Date.parse(a.item.lastModified) : Number.NaN;
      const bt = b.item.lastModified ? Date.parse(b.item.lastModified) : Number.NaN;
      if (!Number.isNaN(at) && !Number.isNaN(bt) && at !== bt) return bt - at;
      return b.item.name.localeCompare(a.item.name);
    })
    .slice(0, 10)
    .map(({ item, type }) => ({
      id: item.key,
      title: humanizeName(item.baseName),
      type,
      url: item.url,
      category: type === "video" ? "Film" : "Frame",
      poster: type === "video" ? posterByBase.get(item.baseName) : undefined
    }));
}

export function Home() {
  const [featured, setFeatured] = useState<FeaturedItem[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [taglineIdx, setTaglineIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const [images, videos, thumbs] = await Promise.all([
        listR2Objects("images/", ["jpg", "jpeg", "png", "webp", "avif", "gif"]),
        listR2Objects("videos/", ["mp4", "webm", "mov", "m4v", "m3u8"]),
        listR2Objects("thumbnails/", ["jpg", "jpeg", "png", "webp", "avif"])
      ]);
      if (!mounted) return;
      setFeatured(buildFeatured(images, videos, thumbs));
    };

    load().catch(() => undefined);
    const interval = window.setInterval(() => load().catch(() => undefined), 60_000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const previewStrip = useMemo(() => featured.slice(0, 4), [featured]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTaglineIdx((i) => (i + 1) % taglines.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (featured.length < 2) return;
    const id = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % featured.length);
    }, 4200);
    return () => window.clearInterval(id);
  }, [featured.length]);

  const goSlide = (next: number) => {
    if (featured.length === 0) return;
    setActiveSlide((next + featured.length) % featured.length);
  };

  return (
    <div>
      <section className="relative overflow-hidden border-b border-white/10">
        <HeroPortal />
        <div className="shell relative section-gap pt-16 md:pt-24">
          <div className="grid items-center gap-10 md:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6 reveal-up">
              <p className="label">Constellation Studio</p>
              <h1 className="max-w-3xl text-5xl font-semibold leading-[1.06] tracking-tight md:text-7xl">
                Cinematic frames,
                <br />
                sculpted in light.
              </h1>
              <p className="dynamic-tagline">{taglines[taglineIdx]}</p>
              <div className="flex flex-wrap gap-3">
                <Link to="/gallery" className="btn btn-primary magnetic-btn cta-pill"><GalleryIcon className="h-4 w-4" /> Explore Gallery</Link>
                <Link to="/videos" className="btn btn-secondary magnetic-btn cta-pill"><FilmIcon className="h-4 w-4" /> Watch Films</Link>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {notes.map((item) => <span key={item} className="badge">{item}</span>)}
              </div>
            </div>

            <Card className="p-5 md:p-6 reveal-up" interactive>
              <p className="label">Latest sequence</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {previewStrip.map((item) => (
                  <div key={item.id} className="overflow-hidden rounded-2xl border border-white/10">
                    <img src={item.type === "video" ? item.poster ?? item.url : item.url} alt={item.title} loading="lazy" className="h-32 w-full object-cover" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      <SectionDivider />

      <section className="shell section-gap reveal-up">
        <SectionTitle title="Featured Motion + Stills" subtitle="Autoplay carousel sourced from your R2 media stream." />
        <div
          className="carousel-shell"
          onTouchStart={(event) => {
            touchStartX.current = event.changedTouches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => {
            if (touchStartX.current == null) return;
            const delta = (event.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
            if (Math.abs(delta) > 48) goSlide(activeSlide + (delta < 0 ? 1 : -1));
            touchStartX.current = null;
          }}
        >
          <div className="carousel-track" style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
            {featured.map((item) => (
              <article key={item.id} className="carousel-card">
                <img src={item.type === "video" ? item.poster ?? item.url : item.url} alt={item.title} className="h-[360px] w-full object-cover" loading="lazy" />
                <div className="carousel-overlay">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{item.category}</p>
                  <h3 className="text-2xl font-medium">{item.title}</h3>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-4 flex justify-center gap-2">
            {featured.map((item, idx) => (
              <button key={item.id} type="button" className={idx === activeSlide ? "carousel-dot is-active" : "carousel-dot"} onClick={() => setActiveSlide(idx)} aria-label={`Go to featured slide ${idx + 1}`} />
            ))}
          </div>
        </div>
      </section>

      <section className="shell section-gap">
        <SectionTitle title="Selected Work" subtitle="R2-driven stream, refreshed automatically." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.slice(0, 6).map((item) => (
            <Card key={item.id} className="group overflow-hidden reveal-up" interactive>
              <img
                src={item.type === "video" ? item.poster ?? item.url : item.url}
                alt={item.title}
                loading="lazy"
                className="h-64 w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.type === "video" ? "Film" : "Image"}</p>
                <h3 className="mt-2 flex items-center justify-between text-xl font-medium">{item.title}<ArrowIcon className="h-4 w-4" /></h3>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
