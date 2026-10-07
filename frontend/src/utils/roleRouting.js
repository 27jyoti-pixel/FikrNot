export const normalizedRole = (user) => String(user?.role || "").toLowerCase();

export const homePathForUser = (user) =>
  normalizedRole(user) === "rector" ? "/rector-dashboard" : "/dashboard";
