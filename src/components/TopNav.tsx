import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { cx } from "../lib/utils";

const items = [
  { to: "/", label: "Overview" },
  { to: "/videos", label: "Films" },
  { to: "/gallery", label: "Gallery" }
];

export function TopNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070b14]/75 backdrop-blur-xl">
      <div className="shell flex h-16 items-center justify-between">
        <Link to="/" className="group flex items-center gap-3" onClick={() => setOpen(false)}>
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-200 to-fuchsia-300 opacity-90 transition group-hover:scale-105" />
          <div>
            <p className="text-sm font-semibold tracking-[0.14em]">VISUALCRAFT</p>
            <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Showroom</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cx(
                  "rounded-full px-4 py-2 text-sm transition",
                  isActive ? "bg-white/15 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button className="btn btn-ghost px-4 py-2 md:hidden" onClick={() => setOpen((v) => !v)} type="button">
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open ? (
        <div className="shell pb-4 md:hidden">
          <div className="card space-y-2 p-3">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cx("block rounded-2xl px-3 py-2 text-sm", isActive ? "bg-white/15 text-white" : "text-slate-300 hover:bg-white/10")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
