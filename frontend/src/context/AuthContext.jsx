import { createContext, useEffect, useMemo, useState } from "react";
import * as auth from "../api/authApi";
export const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [ready, setReady] = useState(false);
  useEffect(() => {
    if (localStorage.getItem("fikrnot_token"))
      auth
        .getMe()
        .then((x) => setUser(x.user || x))
        .catch(() => {
          localStorage.removeItem("fikrnot_token");
          setUser(null);
        })
        .finally(() => setReady(true));
    else setReady(true);
  }, []);
  const value = useMemo(
    () => ({
      user,
      ready,
      async login(body) {
        const r = await auth.login(body);
        if (!r?.token || !r?.user) {
          throw new Error("The server returned an incomplete sign-in response. Please try again.");
        }
        localStorage.setItem("fikrnot_token", r.token);
        setUser(r.user);
        return r.user;
      },
      async loginDemoRector() {
        const r = await auth.loginDemoRector();
        if (!r?.token || !r?.user || r.user.role !== "rector") {
          throw new Error("The server did not return a valid Rector session. Please try again.");
        }
        localStorage.setItem("fikrnot_token", r.token);
        setUser(r.user);
        return r.user;
      },
      async register(body) {
        const r = await auth.register(body);
        if (r.token) localStorage.setItem("fikrnot_token", r.token);
        setUser(r.user);
        return r.user;
      },
      async logout() {
        try {
          await auth.logout();
        } catch {}
        localStorage.removeItem("fikrnot_token");
        setUser(null);
      },
    }),
    [user, ready],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
