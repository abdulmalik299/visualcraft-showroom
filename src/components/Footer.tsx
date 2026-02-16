import { FooterCrest } from "./artwork/FooterCrest";

export function Footer() {
  return (
    <footer className="relative mt-20 border-t border-white/10 bg-black/20">
      <FooterCrest />
      <div className="shell py-12 text-sm text-slate-400">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr]">
          <div className="space-y-3">
            <p className="label">VisualCraft Showroom</p>
            <p className="max-w-lg text-lg text-slate-200">Frames that merge texture, brand presence, and cinematic motion into a single digital portfolio experience.</p>
          </div>
          <div className="space-y-3 md:justify-self-end">
            <p className="label">Connect</p>
            <div className="flex flex-wrap items-center gap-4">
              <a className="footer-link" href="mailto:artist@example.com">artist@example.com</a>
              <a className="footer-link" href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram</a>
              <button type="button" className="btn btn-ghost magnetic-btn px-4 py-2">Newsletter</button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
