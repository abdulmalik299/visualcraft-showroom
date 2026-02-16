import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { cx } from "../lib/utils";

const items = [
  { to: "/", label: "Home" },
  { to: "/videos", label: "Videos" },
  { to: "/gallery", label: "Gallery" }
];

export function TopNav() {
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="container-pad flex h-16 items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-3" onClick={closeMenu}>
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-sky-400 to-fuchsia-500" />
          <div className="leading-tight">
            <div className="text-sm font-extrabold tracking-wide">VisualCraft</div>
            <div className="text-[11px] text-slate-300">Creative Showroom</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                cx(
                  "rounded-xl px-3 py-2 text-sm font-semibold transition",
                  isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
                )
              }
            >
              {it.label}
            </NavLink>
          ))}
        </nav>

        <button
          className="btn btn-ghost px-3 md:hidden"
          type="button"
          aria-expanded={open}
          aria-label="Toggle navigation menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open ? (
        <div className="container-pad pb-4 md:hidden">
          <div className="card space-y-2 p-3">
            {items.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                onClick={closeMenu}
                className={({ isActive }) =>
                  cx(
                    "block rounded-xl px-3 py-2 text-sm font-semibold transition",
                    isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
                  )
                }
              >
                {it.label}
              </NavLink>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
