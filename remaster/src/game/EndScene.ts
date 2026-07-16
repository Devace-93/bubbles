import Phaser from "phaser";
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  POINTS_BAD,
  POINTS_GOOD,
  STREAK_BONUS,
  type RoundResult,
} from "./config";
import { t } from "../i18n";
import { openShare } from "../share";

export class EndScene extends Phaser.Scene {
  private result!: RoundResult;

  constructor() {
    super("end");
  }

  init(result: RoundResult): void {
    this.result = result;
  }

  create(): void {
    const s = t();
    const r = this.result;
    this.sound.play("WOW");

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x03293d, 0.88);

    const title = { fontFamily: "system-ui, sans-serif", fontStyle: "bold", color: "#ffffff" };
    let y = 130;
    this.add
      .text(GAME_WIDTH / 2, y, `${s.finalScore}: ${r.score}`, { ...title, fontSize: "56px", color: "#ffb347" })
      .setOrigin(0.5);
    y += 64;
    this.add
      .text(GAME_WIDTH / 2, y, s.bestStreak(r.bestStreak), { ...title, fontSize: "34px", color: "#8ee6d8" })
      .setOrigin(0.5);
    y += 70;

    const rows: Array<[string, string]> = [
      [`${s.fruits} ×${r.goodCount}`, `${r.goodCount * POINTS_GOOD}`],
      [`${s.veggies} ×${r.badCount}`, `${r.badCount * POINTS_BAD}`],
    ];
    for (const n of [3, 9, 12] as const) {
      if (r.streakCounts[n] > 0) {
        rows.push([`${s.streakBonus(n)} ×${r.streakCounts[n]}`, `+${r.streakCounts[n] * STREAK_BONUS[n]}`]);
      }
    }
    for (const [label, pts] of rows) {
      this.add.text(GAME_WIDTH * 0.2, y, label, { ...title, fontSize: "30px" });
      this.add.text(GAME_WIDTH * 0.8, y, pts, { ...title, fontSize: "30px", color: "#ffb347" }).setOrigin(1, 0);
      y += 46;
    }

    y = Math.max(y + 50, GAME_HEIGHT * 0.62);
    this.button(y, s.playAgain, 0xffb347, 0x5c2e00, () => this.scene.start("game"));
    this.button(y + 100, s.shareFb, 0x1877f2, 0xffffff, () =>
      openShare(r.score, r.bestStreak),
    );
    this.button(y + 200, s.home, 0x35d0ba, 0x04302b, () => {
      window.location.href = "/";
    });
  }

  private button(y: number, label: string, bg: number, fg: number, onClick: () => void): void {
    const rect = this.add
      .rectangle(GAME_WIDTH / 2, y, 420, 78, bg)
      .setInteractive({ useHandCursor: true });
    rect.setStrokeStyle(3, 0xffffff, 0.35);
    this.add
      .text(GAME_WIDTH / 2, y, label, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "32px",
        fontStyle: "bold",
        color: "#" + fg.toString(16).padStart(6, "0"),
      })
      .setOrigin(0.5);
    rect.on("pointerdown", onClick);
  }
}
