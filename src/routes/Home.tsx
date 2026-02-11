import { Link } from "react-router-dom";
import { SectionTitle } from "../components/SectionTitle";

const highlights = [
  { title: "Fast showcase", text: "Responsive cards, lazy loading, and clean layout for portfolio browsing." },
  { title: "Admin publishing", text: "Upload assets to Firebase Storage and publish instantly from one dashboard." },
  { title: "Serverless payments", text: "Use Stripe/PayPal/Payoneer links without building backend checkout." },
  { title: "3D preview", text: "Interactive GLB previews with camera controls, poster fallback, and lighting." }
];

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
                Launch a polished digital showroom for your videos, renders, and 3D assets.
              </h1>
              <p className="mt-4 text-base text-slate-300">
                VisualCraft combines portfolio presentation and product sales in a single fast website. Publish content from
                Firebase, highlight your best work, and guide visitors from discovery to checkout.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/videos" className="btn-primary">Watch Videos</Link>
                <Link to="/store" className="btn-ghost">Browse 3D Store</Link>
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
                  <div className="text-xs text-slate-300">Website speed</div>
                  <div className="mt-1 font-bold">Optimized for static hosting</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs text-slate-300">Security</div>
                  <div className="mt-1 font-bold">Firebase auth + Firestore rules</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs text-slate-300">Asset support</div>
                  <div className="mt-1 font-bold">MP4, JPG/PNG, GLB/GLTF</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs text-slate-300">Scalability</div>
                  <div className="mt-1 font-bold">Ready for future backend upgrade</div>
                </div>
              </div>

              <div className="mt-4 text-xs text-slate-400">
                Tip: Keep your hero videos and product covers compressed for faster first-load on mobile.
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
            <p className="mt-2 text-sm text-slate-300">Users receive a secure verification link in email without OTP codes.</p>
          </div>
          <div className="card p-5">
            <div className="text-sm font-extrabold">Content moderation</div>
            <p className="mt-2 text-sm text-slate-300">Every item has a <span className="badge">visible</span> flag for draft-first publishing.</p>
          </div>
          <div className="card p-5">
            <div className="text-sm font-extrabold">SEO basics</div>
            <p className="mt-2 text-sm text-slate-300">Clean routes and performant navigation for better indexing and usability.</p>
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
