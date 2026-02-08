import { Link } from "react-router-dom";
import { SectionTitle } from "../components/SectionTitle";

export function Home() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(600px_circle_at_20%_10%,rgba(56,189,248,0.25),transparent_45%),radial-gradient(600px_circle_at_90%_30%,rgba(217,70,239,0.25),transparent_45%)]" />
        <div className="container-pad relative py-16">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <div className="badge">Portfolio + Store</div>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">
                A professional showroom for motion design, 3D, and product visuals.
              </h1>
              <p className="mt-4 text-base text-slate-300">
                Showcase your best videos and image projects, then sell or share 3D models with modern previews and clean
                filters—built to run on GitHub Pages with Firebase.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/videos" className="btn-primary">Watch Videos</Link>
                <Link to="/store" className="btn-ghost">Browse 3D Store</Link>
                <Link to="/gallery" className="btn-ghost">Image Gallery</Link>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="card p-4">
                  <div className="text-sm font-bold">Fast showcase</div>
                  <div className="mt-1 text-sm text-slate-300">Responsive cards, lazy loading, and clean layout.</div>
                </div>
                <div className="card p-4">
                  <div className="text-sm font-bold">Admin publishing</div>
                  <div className="mt-1 text-sm text-slate-300">Upload assets to Firebase Storage and publish instantly.</div>
                </div>
                <div className="card p-4">
                  <div className="text-sm font-bold">Serverless payments</div>
                  <div className="mt-1 text-sm text-slate-300">Use Stripe/PayPal/Payoneer links—no backend required.</div>
                </div>
                <div className="card p-4">
                  <div className="text-sm font-bold">3D preview</div>
                  <div className="mt-1 text-sm text-slate-300">Interactive GLB previews with orbit, zoom, and lighting.</div>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <div className="aspect-[16/10] overflow-hidden rounded-xl border border-white/10 bg-black/30">
                <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.35),transparent_40%),radial-gradient(circle_at_70%_55%,rgba(217,70,239,0.25),transparent_45%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0))]" />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs text-slate-300">Featured</div>
                  <div className="mt-1 font-bold">Showreels</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs text-slate-300">Featured</div>
                  <div className="mt-1 font-bold">3D Asset Packs</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs text-slate-300">Featured</div>
                  <div className="mt-1 font-bold">Product Ads</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs text-slate-300">Featured</div>
                  <div className="mt-1 font-bold">Motion Graphics</div>
                </div>
              </div>
              <div className="mt-4 text-xs text-slate-400">
                Tip: use the Admin panel to upload MP4, JPG/PNG, and GLB files to Firebase Storage.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-pad py-14">
        <SectionTitle
          title="Built-in essentials"
          subtitle="Everything you typically need for a professional portfolio + digital store—already included."
        />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card p-5">
            <div className="text-sm font-extrabold">Email-link sign-in</div>
            <p className="mt-2 text-sm text-slate-300">
              Users receive a secure sign-in link (verification) in email. No OTP codes.
            </p>
          </div>
          <div className="card p-5">
            <div className="text-sm font-extrabold">Content moderation</div>
            <p className="mt-2 text-sm text-slate-300">
              Every item has a <span className="badge">visible</span> flag so you can draft privately then publish.
            </p>
          </div>
          <div className="card p-5">
            <div className="text-sm font-extrabold">SEO basics</div>
            <p className="mt-2 text-sm text-slate-300">
              Clean routes, meta description, and fast client-side navigation. Add more meta tags easily.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="btn-primary" to="/login">Open Login</Link>
          <Link className="btn-ghost" to="/admin">Admin (requires your UID)</Link>
        </div>
      </section>
    </div>
  );
}
