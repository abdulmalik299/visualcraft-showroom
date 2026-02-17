import { Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { SectionTitle } from "../components/SectionTitle";
import { Card } from "../components/ui/Card";
import { type R2Object } from "../lib/r2";
import { humanizeName } from "../lib/media";
import { HeroPortal } from "../components/artwork/HeroPortal";
import { SectionDivider } from "../components/artwork/SectionDivider";
import { ArrowIcon, FilmIcon, GalleryIcon, LinkedInIcon, MailIcon } from "../components/icons";
import { useR2Listing } from "../hooks/useR2Listing";
import { useReducedMotion } from "../hooks/useReducedMotion";

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
  return [...images.map((item) => ({ item, type: "image" as const })), ...videos.map((item) => ({ item, type: "video" as const }))]
    .slice(0, 12)
    .map(({ item, type }) => ({
      id: item.key,
      title: humanizeName(item.baseName),
      type,
      url: item.url,
      category: type === "video" ? "Film" : "Still",
      poster: type === "video" ? posterByBase.get(item.baseName) : undefined
    }));
}

const links = [
  { href: "mailto:abdulmelikdilshad@gmail.com", label: "Email", icon: MailIcon },
  { href: "https://www.linkedin.com/in/abdulmalek-ahmed-616b7a174", label: "LinkedIn", icon: LinkedInIcon },
  { href: "https://abdulmalekd1.artstation.com/", label: "ArtStation", icon: GalleryIcon },
  { href: "https://www.freelancer.com/u/abdulmalek3D?sb=t", label: "Freelancer", icon: ArrowIcon },
  { href: "https://vimeo.com/abdulmalekdlshad", label: "Vimeo", icon: FilmIcon }
];

export function Home() {
  const imagesListing = useR2Listing("images/", ["jpg", "jpeg", "png", "webp", "avif", "gif"]);
  const videosListing = useR2Listing("videos/", ["mp4", "webm", "mov", "m4v", "m3u8"]);
  const thumbsListing = useR2Listing("thumbnails/", ["jpg", "jpeg", "png", "webp", "avif"]);
  const reducedMotion = useReducedMotion();
  const [activeSlide, setActiveSlide] = useState(0);
  const cursorRef = useRef({ x: -1000, y: -1000 });

  const featured = useMemo(
    () => buildFeatured(imagesListing.items, videosListing.items, thumbsListing.items),
    [imagesListing.items, videosListing.items, thumbsListing.items]
  );

  useEffect(() => {
    if (reducedMotion || featured.length < 2) return;
    const id = window.setInterval(() => setActiveSlide((prev) => (prev + 1) % featured.length), 5200);
    return () => window.clearInterval(id);
  }, [featured.length, reducedMotion]);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      cursorRef.current = { x: event.clientX, y: event.clientY };
      const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-interactive-card]"));
      window.requestAnimationFrame(() => {
        cards.forEach((card) => {
          const rect = card.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dist = Math.hypot(cx - cursorRef.current.x, cy - cursorRef.current.y);
          const t = Math.max(0, 1 - dist / 360);
          card.style.setProperty("--card-glow", `${0.2 + t * 0.9}`);
          if (t > 0.2) window.dispatchEvent(new CustomEvent("studio-constellation-intensity", { detail: 1 + t * 0.28 }));
        });
      });
    };
    const onLeave = () => {
      window.dispatchEvent(new CustomEvent("studio-constellation-intensity", { detail: 1 }));
      document.querySelectorAll<HTMLElement>("[data-interactive-card]").forEach((card) => card.style.setProperty("--card-glow", "0.2"));
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const current = featured[activeSlide];
  const mediaSrc = current?.type === "video" ? current.poster ?? current.url : current?.url;

  return (
    <div>
      <section className="relative overflow-hidden border-b border-white/10">
        <HeroPortal />
        <div className="shell relative section-gap pt-16 md:pt-24">
          <div className="space-y-6 reveal-up">
            <p className="label">Constellation Studio</p>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[1.04] tracking-tight md:text-7xl">Premium 3D visuals and motion built for modern brands.</h1>
            <p className="max-w-2xl text-lg text-slate-300">Product visualization, cinematic stills, and motion sequences designed for clear communication and high-end presentation.</p>
            <div className="flex flex-wrap gap-3">
              <Link to="/gallery" className="btn btn-primary magnetic-btn cta-pill"><GalleryIcon className="h-4 w-4" /> Explore Gallery</Link>
              <Link to="/videos" className="btn btn-secondary magnetic-btn cta-pill"><FilmIcon className="h-4 w-4" /> Watch Films</Link>
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      <section className="shell section-gap reveal-up">
        <SectionTitle title="Featured work" subtitle="Cinematic module with full artwork framing." />
        {imagesListing.error || videosListing.error ? (
          <Card className="p-6 text-slate-300">
            <p>Media is unavailable right now. Please retry.</p>
            <button className="btn btn-ghost mt-3" onClick={() => { imagesListing.revalidate(); videosListing.revalidate(); }}>Retry</button>
          </Card>
        ) : !current ? (
          <Card className="p-6 text-slate-300">No featured media yet.</Card>
        ) : (
          <div className="cinema-stage">
            <div className="cinema-backdrop" style={{ backgroundImage: `url(${mediaSrc})` }} aria-hidden="true" />
            <article className="cinema-frame">
              <img src={mediaSrc} alt={current.title} className="h-full w-full object-contain" loading="lazy" />
              <div className="carousel-overlay opacity-100">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{current.category}</p>
                <h3 className="text-2xl font-medium">{current.title}</h3>
              </div>
            </article>
            <div className="mt-4 flex items-center gap-2">
              {featured.map((item, idx) => (
                <button key={item.id} type="button" className={idx === activeSlide ? "carousel-dot is-active" : "carousel-dot"} onClick={() => setActiveSlide(idx)} aria-label={`Go to featured slide ${idx + 1}`} />
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="shell section-gap">
        <SectionTitle title="Studio overview" subtitle="Selected work, services, about, and collaboration." />
        <div className="grid gap-4 md:grid-cols-6">
          <Card className="shadow-reveal p-6 md:col-span-4" interactive data-interactive-card>
            <p className="label">Selected work</p>
            <p className="mt-2 text-xl">Commercial-ready stills and motion with realistic materials and clean visual hierarchy.</p>
            <Link to="/gallery" className="mt-4 inline-flex items-center gap-2 text-slate-200">View projects <ArrowIcon className="h-4 w-4" /></Link>
          </Card>
          <Card className="shadow-reveal p-6 md:col-span-2" interactive data-interactive-card>
            <p className="label">Services</p>
            <ul className="mt-3 space-y-2 text-slate-300"><li>3D Product Visualization</li><li>Motion Graphics</li><li>Lighting & Look Development</li></ul>
          </Card>
          <Card className="shadow-reveal p-6 md:col-span-3" interactive data-interactive-card>
            <p className="label">About</p>
            <p className="mt-2 text-slate-300">Blender-focused artist with Adobe post pipeline experience, available for remote collaborations.</p>
            <Link to="/about" className="mt-4 inline-flex items-center gap-2 text-slate-200">Read profile <ArrowIcon className="h-4 w-4" /></Link>
          </Card>
          <Card className="shadow-reveal p-6 md:col-span-3" interactive data-interactive-card>
            <p className="label">Contact</p>
            <p className="mt-2 text-slate-300">Open to freelance, contract, and studio collaborations.</p>
            <div className="mt-4 flex gap-2">
              {links.map(({ href, label, icon: Icon }) => <a key={label} className="icon-btn" href={href} target="_blank" rel="noreferrer" aria-label={label} title={label}><Icon className="h-4 w-4" /></a>)}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
