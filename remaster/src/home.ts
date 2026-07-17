import "@fontsource/luckiest-guy/index.css";
import "./style.css";
import { startBubbleBackground } from "./bg";
import { getLang, isRtl, t } from "./i18n";
import { mountLangSelector } from "./langSelector";
import { openShare } from "./share";

function setMeta(selector: string, content: string): void {
  document.querySelector(selector)?.setAttribute("content", content);
}

function apply(): void {
  const s = t();
  document.documentElement.lang = getLang();
  document.documentElement.dir = isRtl() ? "rtl" : "ltr";
  document.title = s.title;
  setMeta('meta[name="description"]', s.description);
  setMeta('meta[property="og:title"]', s.title);
  setMeta('meta[property="og:description"]', s.description);
  for (const el of document.querySelectorAll<HTMLElement>("[data-i18n]")) {
    const key = el.dataset.i18n as keyof typeof s;
    const value = s[key];
    if (typeof value === "string") el.textContent = value;
  }

  const params = new URLSearchParams(location.search);
  const score = Number(params.get("score"));
  const banner = document.getElementById("banner")!;
  if (Number.isFinite(score) && score > 0) {
    banner.hidden = false;
    banner.textContent = s.challengeBanner(score, Number(params.get("streak")) || 0);
  }
}

function mountSelector(): void {
  // re-mounted on every change so the button shows the new flag/code
  mountLangSelector(document.getElementById("lang-sel")!, () => {
    apply();
    mountSelector();
  });
}
mountSelector();

document.getElementById("share-btn")!.addEventListener("click", () => openShare());

apply();

startBubbleBackground(document.getElementById("bg") as HTMLCanvasElement);
