import "@fontsource/luckiest-guy/index.css";
import "./style.css";
import { startBubbleBackground } from "./bg";
import { getLang, setLang, t } from "./i18n";
import { openShare } from "./share";

function apply(): void {
  const s = t();
  document.documentElement.lang = getLang();
  for (const el of document.querySelectorAll<HTMLElement>("[data-i18n]")) {
    const key = el.dataset.i18n as keyof typeof s;
    const value = s[key];
    if (typeof value === "string") el.textContent = value;
  }
  const toggle = document.getElementById("lang-toggle")!;
  toggle.textContent = getLang() === "en" ? "ES" : "EN";

  const params = new URLSearchParams(location.search);
  const score = Number(params.get("score"));
  const banner = document.getElementById("banner")!;
  if (Number.isFinite(score) && score > 0) {
    banner.hidden = false;
    banner.textContent = s.challengeBanner(score, Number(params.get("streak")) || 0);
  }
}

document.getElementById("lang-toggle")!.addEventListener("click", () => {
  setLang(getLang() === "en" ? "es" : "en");
  apply();
});

document.getElementById("share-btn")!.addEventListener("click", () => openShare());

apply();

startBubbleBackground(document.getElementById("bg") as HTMLCanvasElement);
