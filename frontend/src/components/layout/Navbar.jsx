import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Bell,
  Plus,
  Search,
  Compass,
  LayoutDashboard,
  ChevronDown,
} from "lucide-react";
import useAuth from "../../hooks/useAuth";
import Brand from "../brand/Brand";
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const links = user
    ? [
        ["Browse", "/browse", Compass],
        [
          "Dashboard",
          user.role === "rector" ? "/rector-dashboard" : "/dashboard",
          LayoutDashboard,
        ],
        ["Notifications", "/notifications", Bell],
      ]
    : [["Browse", "/browse", Compass]];
  return (
    <header className="topbar">
      <div className="nav-inner">
        <div className="nav-primary">
          <Brand />
          <nav className={`nav-links ${open ? "open" : ""}`}>
            {links.map(([t, path, I]) => (
              <NavLink className="nav-link" key={path} to={path} onClick={() => setOpen(false)}>
                <I size={16} />
                {t}
              </NavLink>
            ))}
            {!user && (
              <NavLink className="rector-mobile-entry" to="/rector-login" onClick={() => setOpen(false)}>
                Rector login
              </NavLink>
            )}
            {user && (
              <>
                <NavLink
                  className="mobile-report-link"
                  to="/report/lost"
                  onClick={() => setOpen(false)}
                >
                  <Search size={16} /> Report lost
                </NavLink>
                <NavLink
                  className="mobile-report-link"
                  to="/report/found"
                  onClick={() => setOpen(false)}
                >
                  <Plus size={16} /> Report found
                </NavLink>
              </>
            )}
          </nav>
        </div>
        <div className="nav-actions">
          {user ? (
            <>
              <details className="nav-report-menu">
                <summary className="button primary nav-report">
                  <Plus size={16} />
                  <span>Report an item</span>
                  <ChevronDown size={14} className="nav-report-chevron" />
                </summary>
                <div
                  className="nav-report-options"
                  role="group"
                  aria-label="Choose report type"
                >
                  <Link
                    to="/report/lost"
                    onClick={(event) =>
                      event.currentTarget
                        .closest("details")
                        ?.removeAttribute("open")
                    }
                  >
                    <Search size={16} />
                    <span>
                      <b>Report lost</b>
                      <small>Tell campus what you’re missing</small>
                    </span>
                  </Link>
                  <Link
                    to="/report/found"
                    onClick={(event) =>
                      event.currentTarget
                        .closest("details")
                        ?.removeAttribute("open")
                    }
                  >
                    <Plus size={16} />
                    <span>
                      <b>Report found</b>
                      <small>Help return an item to its owner</small>
                    </span>
                  </Link>
                </div>
              </details>
              <button
                className="avatar"
                aria-label="Open profile"
                onClick={() => nav("/profile")}
              >
                {(user.name || "S")[0]}
              </button>
              <button
                className="text-button signout"
                onClick={async () => {
                  await logout();
                  nav("/");
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link className="text-button rector-nav-entry" to="/rector-login">
                Rector login
              </Link>
              <Link className="text-button" to="/login">
                Log in
              </Link>
              <Link className="button primary" to="/register">
                Join campus
              </Link>
            </>
          )}
          <button
            className="mobile-menu"
            aria-label={open ? "Close navigation" : "Open navigation"}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}
