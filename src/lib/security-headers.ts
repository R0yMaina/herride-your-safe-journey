/**
 * Security headers applied to every response leaving the Worker.
 *
 * Set here rather than in a `_headers` file: `_headers` is honoured for static
 * asset responses, but this app's HTML is server-rendered, and the SSR
 * responses are exactly the ones that need framing and referrer protection.
 * Wrapping the fetch handler is the only place that covers both.
 */

/** Hosts the app legitimately talks to. Keep in step with services/maps + Supabase. */
const CONNECT = [
  "'self'",
  "https://*.supabase.co",
  "wss://*.supabase.co", // Realtime
  "https://photon.komoot.io", // place search
  "https://places.googleapis.com", // Google Places (New)
  "https://maps.googleapis.com", // Maps JS SDK + geocoding
  "https://api.mapbox.com", // tiles, geocoding, directions
  "https://router.project-osrm.org", // routing fallback
  "https://*.basemaps.cartocdn.com", // tile fallback
].join(" ");

const IMG = [
  "'self'",
  "data:",
  "blob:",
  "https://*.basemaps.cartocdn.com",
  "https://api.mapbox.com",
  "https://maps.googleapis.com",
  "https://maps.gstatic.com",
  "https://*.supabase.co", // signed URLs for driver documents
  "https://*.r2.dev", // social preview image
].join(" ");

/**
 * `'unsafe-inline'` on script-src is not an oversight: TanStack Start emits an
 * inline hydration payload, and Google's Maps SDK injects further scripts. A
 * nonce would be the correct answer and needs the framework to thread one
 * through — which is why the policy below ships REPORT-ONLY first.
 */
const CSP = [
  "default-src 'self'",
  `connect-src ${CONNECT}`,
  `img-src ${IMG}`,
  "script-src 'self' 'unsafe-inline' https://maps.googleapis.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

/**
 * Enforced on every response.
 *
 * CSP is deliberately Report-Only for now. An enforced policy that breaks
 * hydration takes the whole app down, and we have no report data yet — so it
 * observes first. Flip `CSP_ENFORCED` once reports are clean.
 */
const CSP_ENFORCED = false;

const HEADERS: Readonly<Record<string, string>> = Object.freeze({
  // Clickjacking. frame-ancestors in CSP supersedes this for modern browsers;
  // X-Frame-Options still covers older ones.
  "X-Frame-Options": "DENY",
  // Stop browsers guessing a different content type than we declared.
  "X-Content-Type-Options": "nosniff",
  // Don't leak ride URLs (which carry ride ids) to third parties.
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // Geolocation is ours to use; deny the rest rather than leave them open.
  "Permissions-Policy": [
    "geolocation=(self)",
    "camera=(self)", // driver document capture
    "microphone=()",
    "payment=()",
    "usb=()",
    "magnetometer=()",
    "accelerometer=()",
    "gyroscope=()",
  ].join(", "),
  // Two years, subdomains included — the app is HTTPS-only in every environment.
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
  // Isolate our browsing context from any opener.
  "Cross-Origin-Opener-Policy": "same-origin",
});

/**
 * Returns a copy of `response` carrying the security headers.
 *
 * The body is passed through untouched so streamed SSR responses keep
 * streaming, and existing headers (content-type, cache-control, set-cookie)
 * are preserved.
 */
export function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(HEADERS)) headers.set(name, value);
  headers.set(
    CSP_ENFORCED ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only",
    CSP,
  );

  // 101/204/304 have no body and Response rejects one; hand them back re-headed.
  if (response.status === 101 || response.status === 204 || response.status === 304) {
    return new Response(null, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/** Exposed for tests, so the policy can be asserted without a live request. */
export const securityHeaderNames = Object.keys(HEADERS);
export const contentSecurityPolicy = CSP;
export const cspIsEnforced = CSP_ENFORCED;
