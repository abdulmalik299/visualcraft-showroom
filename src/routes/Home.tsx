import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { SectionTitle } from "../components/SectionTitle";
import { Card } from "../components/ui/Card";
import { listR2Objects, type R2Object } from "../lib/r2";
import { humanizeName } from "../lib/media";
import { NetworkField } from "../components/NetworkField";

type FeaturedItem = {
  id: string;
  title: string;
  url: string;
  type: "image" | "video";
  poster?: string;
};

const notes = ["Direction", "Motion", "Still Life", "Brand Frames"];

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
    .slice(0, 6)
    .map(({ item, type }) => ({
      id: item.key,
      title: humanizeName(item.baseName),
      type,
      url: item.url,
      poster: type === "video" ? posterByBase.get(item.baseName) : undefined
    }));
}

export function Home() {
  const [featured, setFeatured] = useState<FeaturedItem[]>([]);

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
    const interval = window.setInterval(() => {
      load().catch(() => undefined);
    }, 60_000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const previewStrip = useMemo(() => featured.slice(0, 4), [featured]);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-white/10">
        <NetworkField />
        <div className="shell relative section-gap">
          <div className="grid items-center gap-8 md:grid-cols-[1.2fr_0.9fr] md:gap-12">
            <div className="space-y-6">
              <p className="label">Artist Portfolio</p>
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
                Quietly cinematic visuals for brands, objects, and stories.
              </h1>
              <p className="max-w-xl text-base text-slate-300 md:text-lg">
                A living showroom shaped by light, texture, and movement.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/gallery" className="btn btn-primary">Enter Gallery</Link>
                <Link to="/videos" className="btn btn-secondary">Watch Films</Link>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {notes.map((item) => <span key={item} className="badge">{item}</span>)}
              </div>
            </div>

            <Card className="p-5 md:p-6">
              <p className="label">Recent Frames</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {previewStrip.map((item) => (
                  <div key={item.id} className="overflow-hidden rounded-2xl border border-white/10">
                    <img src={item.type === "video" ? item.poster ?? item.url : item.url} alt={item.title} loading="lazy" className="h-28 w-full object-cover" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="shell section-gap">
        <SectionTitle title="Selected Work" subtitle="The latest uploads appear here automatically every minute." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((item) => (
            <Card key={item.id} className="group overflow-hidden">
              <img
                src={item.type === "video" ? item.poster ?? item.url : item.url}
                alt={item.title}
                loading="lazy"
                className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.type === "video" ? "Film" : "Image"}</p>
                <h3 className="mt-2 text-xl font-medium">{item.title}</h3>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
