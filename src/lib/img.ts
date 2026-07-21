// Fandom's CDN 404s any hotlink whose Referer isn't on its allowlist (our own
// deploy domain is not), so we route thumbnails through the free weserv.nl image
// proxy. It fetches server-side (no Referer problem), caches, and re-encodes to
// webp — keeping the app fully static with no backend of our own.
export function proxied(url: string | null, width = 200): string | null {
  if (!url) return null;
  const raw = url.replace(/^https?:\/\//, "");
  return `https://images.weserv.nl/?url=${encodeURIComponent(raw)}&w=${width}&output=webp`;
}
