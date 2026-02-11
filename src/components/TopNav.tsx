import { useMemo, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../state/auth";
import { cx } from "../lib/utils";

const items = [
  { to: "/", label: "Home" },
  { to: "/videos", label: "Videos" },
  { to: "/gallery", label: "Gallery" },
  { to: "/store", label: "3D Store" }
];

export function TopNav() {
  const { user, isAdmin, logout } = useAuth();
  const loc = useLocation();
  const [open, setOpen] = useState(false);

  const accountLabel = useMemo(() => {
    if (!user?.email) return "Signed in";
    if (user.email.length <= 22) return user.email;
    return `${user.email.slice(0, 20)}…`;
  }, [user?.email]);

  const closeMenu = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="container-pad flex h-16 items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-3" onClick={closeMenu}>
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-sky-400 to-fuchsia-500" />
          <div className="leading-tight">
            <div className="text-sm font-extrabold tracking-wide">VisualCraft</div>
            <div className="text-[11px] text-slate-300">Showroom & 3D Asset Store</div>
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

        <div className="hidden items-center gap-2 md:flex">
          {isAdmin && (
            <Link to="/admin" className={cx("btn-ghost", loc.pathname.startsWith("/admin") && "bg-white/10")}>
              Admin
            </Link>
          )}
          {!user ? (
            <Link to="/login" className="btn-primary">
              Login / Sign up
            </Link>
          ) : (
            <>
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">{accountLabel}</div>
              <button onClick={logout} className="btn-ghost" type="button">
                Logout
              </button>
            </>
          )}
        </div>

        <button
          className="btn-ghost px-3 md:hidden"
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

            <div className="mt-2 border-t border-white/10 pt-2">
              {isAdmin ? (
                <Link to="/admin" className="btn-ghost w-full" onClick={closeMenu}>
                  Admin
                </Link>
              ) : null}

              {!user ? (
                <Link to="/login" className="btn-primary mt-2 w-full" onClick={closeMenu}>
                  Login / Sign up
                </Link>
              ) : (
                <>
                  <div className="mt-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">{accountLabel}</div>
                  <button
                    onClick={() => {
                      closeMenu();
                      logout();
                    }}
                    className="btn-ghost mt-2 w-full"
                    type="button"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
