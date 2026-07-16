const SITE = "https://bubbles.3m4.net";

// Facebook's share dialog only honors the page's Open Graph tags, so the
// score travels in the shared URL and the homepage shows it as a banner.
export function shareUrl(score?: number, streak?: number): string {
  const target = new URL(SITE + "/");
  if (score !== undefined) {
    target.searchParams.set("score", String(score));
    target.searchParams.set("streak", String(streak ?? 0));
  }
  return (
    "https://www.facebook.com/sharer/sharer.php?u=" +
    encodeURIComponent(target.toString())
  );
}

export function openShare(score?: number, streak?: number): void {
  window.open(shareUrl(score, streak), "fb-share", "width=626,height=436,popup");
}
