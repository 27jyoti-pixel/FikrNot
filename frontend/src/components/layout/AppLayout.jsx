import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
export default function AppLayout() {
  const { pathname } = useLocation();
  const isLanding = pathname === "/";
  return (
    <div className={`app-shell${isLanding ? " landing-shell" : ""}`}>
      <Navbar />
      <main className="app-main">
        <Outlet />
      </main>
      {/* <footer className="footer">
        <span>FikrNot</span>
        <span>Made for a campus that looks out for one another.</span>
      </footer> */}
    </div>
  );
}
