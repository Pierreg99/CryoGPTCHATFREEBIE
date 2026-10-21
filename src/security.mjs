export const MAX_REQUEST_BYTES = 200000;
export const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Cache-Control": "no-store",
  "Content-Security-Policy":
    "default-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'; frame-src 'none'",
};
export function requestBoundary(req, port) {
  const origin = `http://127.0.0.1:${port}`;
  if (req.headers.host !== `127.0.0.1:${port}`)
    return {
      status: 403,
      error: "Nur die kanonische Loopback-Adresse ist erlaubt.",
    };
  let url;
  try {
    url = new URL(req.url, origin);
  } catch {
    return { status: 400, error: "Ungültige URL." };
  }
  if (url.origin !== origin)
    return { status: 403, error: "Fremde Zieladresse nicht erlaubt." };
  if (req.method === "POST" && url.pathname.startsWith("/api/")) {
    const suppliedOrigin = req.headers.origin,
      site = req.headers["sec-fetch-site"];
    // Legacy local CLI clients have neither Origin nor browser Fetch Metadata.
    if (
      (suppliedOrigin !== undefined && suppliedOrigin !== origin) ||
      (site && (site === "cross-site" || suppliedOrigin !== origin))
    )
      return {
        status: 403,
        error: "Fremder oder undurchsichtiger Browser-Ursprung nicht erlaubt.",
      };
    if (
      !/^application\/json(?:\s*;|$)/i.test(req.headers["content-type"] || "")
    )
      return { status: 415, error: "JSON erwartet." };
    const length = req.headers["content-length"];
    if (
      length !== undefined &&
      (!/^\d+$/.test(length) || Number(length) > MAX_REQUEST_BYTES)
    )
      return { status: 413, error: "Anfrage überschreitet das Größenlimit." };
  }
  return null;
}
