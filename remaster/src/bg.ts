// Rising-bubbles background on a plain 2D canvas, shared by the homepage and
// the game page (it fills the letterboxed area around the Phaser canvas).
interface Bubble {
  x: number;
  y: number;
  r: number;
  speed: number;
  drift: number;
  phase: number;
}

export function startBubbleBackground(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext("2d")!;
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
}
