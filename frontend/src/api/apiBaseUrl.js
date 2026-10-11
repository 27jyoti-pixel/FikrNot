const DEVELOPMENT_API_ORIGIN = "http://localhost:5000";
const PRODUCTION_API_ORIGIN = "https://fikrnot-4xsa.onrender.com";

export function resolveApiBaseUrl(configuredUrl, isDevelopment) {
  const fallback = isDevelopment
    ? DEVELOPMENT_API_ORIGIN
    : PRODUCTION_API_ORIGIN;
  const configured = String(configuredUrl || "").trim();
  const pointsToLoopback = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\/|$)/i.test(
    configured,
  );
  const selectedUrl =
    !isDevelopment && pointsToLoopback ? fallback : configured || fallback;
  const origin = selectedUrl.trim().replace(/\/+$/, "");

  return /\/api$/i.test(origin) ? origin : `${origin}/api`;
}
