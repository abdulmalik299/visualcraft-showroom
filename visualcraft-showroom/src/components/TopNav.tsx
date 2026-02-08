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

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur">
      <div className="container-pad flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
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

        <div className="flex items-center gap-2">
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
              <div className="hidden rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 md:block">
                {user.email ?? "Signed in"}
              </div>
              <button onClick={logout} className="btn-ghost">
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
