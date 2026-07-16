import "./style.css";
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

// Rising-bubbles background on a plain canvas — kept tiny on purpose;
// the heavyweight rendering all lives in the Phaser game at /play/.
const canvas = document.getElementById("bg") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

interface Bubble {
  x: number;
  y: number;
  r: number;
  speed: number;
  drift: number;
  phase: number;
}

let bubbles: Bubble[] = [];

function resize(): void {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  const count = Math.min(40, Math.floor(innerWidth / 30));
  bubbles = Array.from({ length: count }, () => ({
    x: Math.random() * innerWidth,
    y: Math.random() * innerHeight,
    r: 4 + Math.random() * 22,
    speed: 12 + Math.random() * 30,
    drift: 10 + Math.random() * 20,
    phase: Math.random() * Math.PI * 2,
  }));
}

let last = performance.now();

function frame(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const b of bubbles) {
    b.y -= b.speed * dt;
    b.phase += dt;
    if (b.y < -b.r) {
      b.y = canvas.height + b.r;
      b.x = Math.random() * canvas.width;
    }
    const x = b.x + Math.sin(b.phase) * b.drift;
    ctx.beginPath();
    ctx.arc(x, b.y, b.r, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fill();
  }
  requestAnimationFrame(frame);
}

addEventListener("resize", resize);
resize();
requestAnimationFrame(frame);
