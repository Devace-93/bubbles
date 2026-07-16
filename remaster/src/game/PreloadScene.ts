import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, SOUNDS, SPRITES } from "./config";
import { t } from "../i18n";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("preload");
  }

  preload(): void {
    const { width, height } = this.scale;
    const barBg = this.add.rectangle(width / 2, height / 2, width * 0.6, 14, 0xffffff, 0.2);
    const bar = this.add
      .rectangle(barBg.getTopLeft().x, height / 2, 1, 14, 0x35d0ba)
      .setOrigin(0, 0.5);
    this.load.on("progress", (v: number) => bar.setSize(barBg.width * v, 14));

    for (const names of Object.values(SPRITES)) {
      for (const name of names) {
        this.load.svg(name, `/art/${name}.svg`, { scale: 1.4 });
      }
    }
    for (const badge of ["plus50", "minus7", "plus5s"]) {
      this.load.svg(`badge_${badge}`, `/art/badge_${badge}.svg`, { scale: 1.5 });
    }
    this.load.svg("bubble", "/art/bubble.svg", { scale: 1.2 });
    for (const [key, file] of Object.entries(SOUNDS)) {
      this.load.audio(key, `/assets/sounds/${file}`);
    }
  }

  create(): void {
    // A user gesture is required before the browser lets audio play.
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.3, "BUBBLES", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "110px",
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#0a4d6e",
        strokeThickness: 12,
      })
      .setOrigin(0.5);
    this.add.image(GAME_WIDTH / 2 - 190, GAME_HEIGHT * 0.42, "strawberry").setScale(0.6);
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT * 0.44, "orange").setScale(0.6);
    this.add.image(GAME_WIDTH / 2 + 190, GAME_HEIGHT * 0.42, "watermelon").setScale(0.6);
    const tap = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.62, t().tapToStart, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "42px",
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    this.tweens.add({ targets: tap, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });
    this.input.once("pointerdown", () => {
      if (this.sound instanceof Phaser.Sound.WebAudioSoundManager) {
        this.sound.context.resume();
      }
      this.scene.start("game");
    });
  }
}
