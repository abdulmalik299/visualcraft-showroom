export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950">
      <div className="container-pad grid gap-6 py-10 md:grid-cols-3">
        <div>
          <div className="text-sm font-bold tracking-wide">VisualCraft</div>
          <p className="mt-2 text-sm text-slate-300">
            A premium artist portfolio showroom for stills, motion, and brand-driven visuals.
          </p>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">Contact</div>
          <div className="mt-2 space-y-2 text-sm text-slate-300">
            <div>Email: <a className="underline hover:text-white" href="mailto:artist@example.com">artist@example.com</a></div>
            <div>WhatsApp: <a className="underline hover:text-white" href="https://wa.me/" target="_blank" rel="noreferrer">Add your direct link</a></div>
            <div>Location: Erbil, Kurdistan — Iraq</div>
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">Social</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <a className="btn-ghost btn" href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram</a>
            <a className="btn-ghost btn" href="https://www.behance.net/" target="_blank" rel="noreferrer">Behance</a>
            <a className="btn-ghost btn" href="https://www.youtube.com/" target="_blank" rel="noreferrer">YouTube</a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} VisualCraft. All rights reserved.
      </div>
    </footer>
  );
}
