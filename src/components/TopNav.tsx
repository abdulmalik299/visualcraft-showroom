import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { cx } from "../lib/utils";
import { FilmIcon, GalleryIcon, LogoMark, ToggleStudioModeIcon } from "./icons";

const items = [
  { to: "/", label: "Home" },
  { to: "/videos", label: "Videos", icon: FilmIcon },
  { to: "/gallery", label: "Gallery", icon: GalleryIcon }
];

export function TopNav() {
  const [open, setOpen] = useState(false);
  const [blueprint, setBlueprint] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050914]/60 backdrop-blur-xl">
      <div className="shell flex h-16 items-center justify-between">
        <Link to="/" className="group flex items-center gap-3" onClick={() => setOpen(false)} aria-label="VisualCraft Home">
          <LogoMark className="h-10 w-10" title="VisualCraft logo" />
          <div className="overflow-hidden">
            <p className="logo-reveal text-xs font-semibold tracking-[0.2em] text-slate-100">VISUALCRAFT</p>
            <p className="logo-reveal delay-75 text-[10px] uppercase tracking-[0.28em] text-slate-400">Constellation Studio</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cx("nav-pill nav-underline", isActive ? "is-active text-white" : "text-slate-300 hover:text-white")
                }
              >
                {Icon ? <Icon className="h-4 w-4" aria-label={`${item.label} icon`} /> : <span className="h-4 w-4" />}
                {item.label}
              </NavLink>
            );
          })}
          <button
            type="button"
            className="icon-btn magnetic-btn"
            onClick={() => {
              const next = !blueprint;
              setBlueprint(next);
              document.body.classList.toggle("blueprint-mode", next);
            }}
            aria-label="Toggle studio mode"
          >
            <ToggleStudioModeIcon className="h-5 w-5" />
          </button>
        </nav>

        <button className="btn btn-ghost px-4 py-2 md:hidden" onClick={() => setOpen((v) => !v)} type="button">
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open ? (
        <div className="shell pb-4 md:hidden">
          <div className="card space-y-2 p-3">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cx("flex items-center gap-2 rounded-2xl px-3 py-2 text-sm", isActive ? "bg-white/15 text-white" : "text-slate-300 hover:bg-white/10")
                  }
                >
                  {Icon ? <Icon className="h-4 w-4" /> : <span className="h-4 w-4" />}
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        </div>
      ) : null}
    </header>
  );
}
