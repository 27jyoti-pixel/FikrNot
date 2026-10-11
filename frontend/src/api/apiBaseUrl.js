const DEVELOPMENT_API_ORIGIN = "http://localhost:5000";
const PRODUCTION_API_ORIGIN = "https://fikrnot-4xsa.onrender.com";

export function resolveApiBaseUrl(configuredUrl, isDevelopment, pageHostname = "") {
  const hostname = String(pageHostname || "").trim().toLowerCase();
  const pageIsLoopback =
    !hostname ||
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]";
  const localDevelopment = isDevelopment && pageIsLoopback;
  const fallback = localDevelopment
    ? DEVELOPMENT_API_ORIGIN
    : PRODUCTION_API_ORIGIN;
  const configured = String(configuredUrl || "").trim();
  const pointsToLoopback = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\/|$)/i.test(
    configured,
  );
  const selectedUrl =
    !localDevelopment && pointsToLoopback ? fallback : configured || fallback;
  const origin = selectedUrl.trim().replace(/\/+$/, "");

  return /\/api$/i.test(origin) ? origin : `${origin}/api`;
}
