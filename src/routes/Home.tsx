import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { SectionTitle } from "../components/SectionTitle";
import { Card } from "../components/ui/Card";
import { listR2Objects, type R2Object } from "../lib/r2";
import { humanizeName } from "../lib/media";

type FeaturedItem = {
  id: string;
  title: string;
  url: string;
  type: "image" | "video";
  poster?: string;
};

const services = [
  { title: "Brand Visual Design", text: "Identity systems, logos, and visual storytelling built for modern brands." },
  { title: "Product Visualization", text: "Premium stills and short-form loops for launches, ads, and social campaigns." },
  { title: "Motion Direction", text: "Cinematic motion pieces with pacing, texture, and intentional mood." },
  { title: "UI Presentation Frames", text: "Polished interface stills for apps, landing pages, and pitch decks." }
];

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
        listR2Objects("videos/", ["mp4", "webm", "mov", "m4v"]),
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
        <div className="absolute inset-0 bg-[radial-gradient(620px_circle_at_15%_5%,rgba(56,189,248,0.28),transparent_45%),radial-gradient(520px_circle_at_85%_25%,rgba(217,70,239,0.2),transparent_45%)]" />
        <div className="container-pad relative py-16 md:py-20">
          <div className="grid items-center gap-8 md:grid-cols-[1.2fr_1fr]">
            <div>
              <span className="badge">Visual Portfolio</span>
              <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl">Crafting visual stories with precision and atmosphere.</h1>
              <p className="mt-5 max-w-xl text-base text-slate-300 md:text-lg">
                I design cinematic frames, brand visuals, and polished motion pieces that make products and ideas feel timeless.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/videos" className="btn-primary btn">Explore Videos</Link>
                <Link to="/gallery" className="btn-secondary btn">View Gallery</Link>
              </div>
            </div>

            <Card className="p-4 md:p-5">
              <p className="label">Featured Preview</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {previewStrip.map((item) => (
                  <div key={item.id} className="overflow-hidden rounded-xl border border-white/10">
                    {item.type === "image" ? (
                      <img src={item.url} alt={item.title} loading="lazy" decoding="async" className="h-28 w-full object-cover" />
                    ) : (
                      <img
                        src={item.poster ?? item.url}
                        alt={`${item.title} preview`}
                        loading="lazy"
                        decoding="async"
                        className="h-28 w-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="container-pad py-14">
        <SectionTitle
          title="Featured Work"
          subtitle="Automatically curated from the latest uploads so your newest visuals are always front and center."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              {item.type === "image" ? (
                <img src={item.url} alt={item.title} loading="lazy" decoding="async" className="h-52 w-full object-cover" />
              ) : (
                <img src={item.poster ?? item.url} alt={item.title} loading="lazy" decoding="async" className="h-52 w-full object-cover" />
              )}
              <div className="p-4">
                <p className="text-sm text-slate-400">{item.type === "video" ? "Video" : "Image"}</p>
                <h3 className="mt-1 text-lg font-semibold">{item.title}</h3>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="container-pad py-8">
        <SectionTitle title="Services" subtitle="Flexible collaborations for campaigns, launches, and portfolio-ready visual systems." />
        <div className="grid gap-4 md:grid-cols-2">
          {services.map((service) => (
            <Card key={service.title} className="p-5">
              <h3 className="text-lg font-semibold">{service.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{service.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="container-pad py-14">
        <Card className="p-7 md:p-9">
          <p className="label">Let’s collaborate</p>
          <h2 className="mt-2 text-2xl font-bold md:text-3xl">Ready to build something memorable?</h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-300 md:text-base">
            Available for selected commercial, editorial, and product-focused projects. Reach out through social channels or email to discuss scope.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a className="btn btn-primary" href="mailto:artist@example.com">Email</a>
            <a className="btn btn-ghost" href="https://instagram.com/" target="_blank" rel="noreferrer">Instagram</a>
            <a className="btn btn-ghost" href="https://behance.net/" target="_blank" rel="noreferrer">Behance</a>
            <a className="btn btn-ghost" href="https://linkedin.com/" target="_blank" rel="noreferrer">LinkedIn</a>
          </div>
        </Card>
      </section>
    </div>
  );
}
