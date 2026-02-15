import { Link } from "react-router-dom";
import { SectionTitle } from "../components/SectionTitle";

const highlights = [
  { title: "Live R2 gallery", text: "Images load directly from your Cloudflare R2 images/ folder." },
  { title: "Auto video discovery", text: "New videos appear automatically from videos/ with matching thumbnails/." },
  { title: "Multiple quality", text: "If you upload 720p/1080p variants, visitors can choose playback quality." },
  { title: "Fast playback", text: "Metadata preloading, poster-first rendering, and lightweight cards for speed." }
];

export function Home() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(600px_circle_at_20%_10%,rgba(56,189,248,0.25),transparent_45%),radial-gradient(600px_circle_at_90%_30%,rgba(217,70,239,0.25),transparent_45%)]" />
        <div className="container-pad relative py-16">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <div className="badge">Cloudflare R2 Powered</div>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">
                A clean digital showroom for your videos and image work.
              </h1>
              <p className="mt-4 text-base text-slate-300">
                Upload files into R2 and this website automatically reflects your latest media in the Videos and Gallery tabs.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/videos" className="btn-primary">Watch Videos</Link>
                <Link to="/gallery" className="btn-ghost">Image Gallery</Link>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {highlights.map((item) => (
                  <div key={item.title} className="card p-4">
                    <div className="text-sm font-bold">{item.title}</div>
                    <div className="mt-1 text-sm text-slate-300">{item.text}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <div className="aspect-[16/10] overflow-hidden rounded-xl border border-white/10 bg-black/30">
                <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.35),transparent_40%),radial-gradient(circle_at_70%_55%,rgba(217,70,239,0.25),transparent_45%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0))]" />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs text-slate-300">Folder sync</div>
                  <div className="mt-1 font-bold">images/ videos/ thumbnails/</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs text-slate-300">Security</div>
                  <div className="mt-1 font-bold">No visitor accounts required</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs text-slate-300">Media support</div>
                  <div className="mt-1 font-bold">MP4/WebM + JPG/PNG/WebP</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs text-slate-300">Live updates</div>
                  <div className="mt-1 font-bold">Auto-refresh every 60 seconds</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-pad py-14">
        <SectionTitle title="How uploads map to the site" subtitle="Use consistent file names so thumbnails pair automatically." />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card p-5">
            <div className="text-sm font-extrabold">Gallery tab</div>
            <p className="mt-2 text-sm text-slate-300">Any image in <span className="badge">images/</span> appears as a gallery card.</p>
          </div>
          <div className="card p-5">
            <div className="text-sm font-extrabold">Videos tab</div>
            <p className="mt-2 text-sm text-slate-300">Any video in <span className="badge">videos/</span> appears in the video grid.</p>
          </div>
          <div className="card p-5">
            <div className="text-sm font-extrabold">Thumbnail pairing</div>
            <p className="mt-2 text-sm text-slate-300">A thumbnail in <span className="badge">thumbnails/</span> with the same base filename is linked automatically.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
