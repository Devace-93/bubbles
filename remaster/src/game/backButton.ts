import Phaser from "phaser";

// Back-to-home button: a bubble containing a left-pointing arrow
// (triangular head with a wide tail). Used by the game HUD and the
// tap-to-start screen.
export function addBackButton(scene: Phaser.Scene, cx: number, cy: number, size = 60): void {
  const bubble = scene.add.image(cx, cy, "bubble").setDepth(52);
  bubble.setScale(size / bubble.height);

  const s = size / 60;
  const g = scene.add.graphics({ x: cx, y: cy }).setDepth(53);
  g.fillStyle(0xffffff, 1);
  g.lineStyle(2, 0x03293d, 0.6);
  g.beginPath();
  g.moveTo(-16 * s, 0); // tip
  g.lineTo(0, -14 * s); // head, wide base
  g.lineTo(0, -7 * s);
  g.lineTo(15 * s, -7 * s); // tail
  g.lineTo(15 * s, 7 * s);
  g.lineTo(0, 7 * s);
  g.lineTo(0, 14 * s);
  g.closePath();
  g.fillPath();
  g.strokePath();

  const zone = scene.add
    .zone(cx, cy, size + 12, size + 12)
    .setDepth(54)
    .setInteractive({ useHandCursor: true });
  zone.on("pointerdown", () => {
    window.location.href = "/";
  });
}
