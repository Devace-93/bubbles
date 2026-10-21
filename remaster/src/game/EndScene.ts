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
import { recordScore } from "../highScore";
import { submitScore, type SubmitOutcome } from "../api";
import { announce } from "./announcer";
import { onLangChange } from "./langChange";

// The round result of a scene (keeps onlineLine free of `this.result!` noise).
function r(scene: EndScene): RoundResult {
  return scene.roundResult;
}

export class EndScene extends Phaser.Scene {
  private result!: RoundResult;

  get roundResult(): RoundResult {
    return this.result;
  }

  constructor() {
    super("end");
  }

  init(result: RoundResult): void {
    this.result = result;
  }

  private isHighScore = false;
  // Online submission (signed-in players only): undefined until the API answers.
  private online: SubmitOutcome | undefined;
  // everything drawn by render(), destroyed and redrawn on a language change
  private ui: Phaser.GameObjects.GameObject[] = [];

  create(): void {
    this.sound.play("WOW");
    this.isHighScore = recordScore(this.result.score);
    if (this.isHighScore) announce(this, "newHighScore");
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x03293d, 0.88);
    this.render();
    onLangChange(this, () => this.render());
    // Anonymous players get a silent "anonymous" outcome; nothing changes for them.
    submitScore(this.result.score).then((outcome) => {
      if (!this.scene.isActive()) return;
      this.online = outcome;
      this.render();
    });
  }

  private render(): void {
    for (const obj of this.ui) obj.destroy();
    this.ui = [];
    const s = t();
    const r = this.result;
    const isHighScore = this.isHighScore;

    const title = { fontFamily: "system-ui, sans-serif", fontStyle: "bold", color: "#ffffff" };
    let y = 130;
    this.ui.push(
      this.add
      .text(GAME_WIDTH / 2, y, `${s.finalScore}: ${r.score}`, {
        ...title,
        fontFamily: '"Luckiest Guy", system-ui, sans-serif',
        fontSize: "56px",
        color: "#ffb347",
      })
      .setOrigin(0.5),
    );
    y += 64;
    this.ui.push(
      this.add
        .text(GAME_WIDTH / 2, y, s.bestStreak(r.bestStreak), { ...title, fontSize: "34px", color: "#8ee6d8" })
        .setOrigin(0.5),
    );
    if (isHighScore) {
      y += 48;
      const badge = this.add
        .text(GAME_WIDTH / 2, y, `🏆 ${s.newHighScore}`, { ...title, fontSize: "30px", color: "#ffe066" })
        .setOrigin(0.5);
      this.tweens.add({ targets: badge, scale: 1.08, duration: 500, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      this.ui.push(badge);
    }
    const online = this.onlineLine(s);
    if (online) {
      y += 44;
      this.ui.push(
        this.add.text(GAME_WIDTH / 2, y, online.text, { ...title, fontSize: "26px", color: online.color }).setOrigin(0.5),
      );
    }
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
      this.ui.push(
        this.add.text(GAME_WIDTH * 0.2, y, label, { ...title, fontSize: "30px" }),
        this.add.text(GAME_WIDTH * 0.8, y, pts, { ...title, fontSize: "30px", color: "#ffb347" }).setOrigin(1, 0),
      );
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

  // One line about the online score: the player's online best (or a new
  // online record), or why the score was not saved. Nothing for anonymous play.
  private onlineLine(s: ReturnType<typeof t>): { text: string; color: string } | null {
    const o = this.online;
    if (!o) return null;
    if (o.ok) {
      const record = o.result.best === r(this).score;
      return record
        ? { text: `🌐 ${s.newOnlineRecord}`, color: "#ffe066" }
        : { text: `🌐 ${s.onlineBest(o.result.best)}`, color: "#8ee6d8" };
    }
    if (o.reason === "unverified") return { text: s.verifyToSave, color: "#ffb347" };
    return null;
  }

  private button(y: number, label: string, bg: number, fg: number, onClick: () => void): void {
    const rect = this.add
      .rectangle(GAME_WIDTH / 2, y, 420, 78, bg)
      .setInteractive({ useHandCursor: true });
    rect.setStrokeStyle(3, 0xffffff, 0.35);
    const text = this.add
      .text(GAME_WIDTH / 2, y, label, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "32px",
        fontStyle: "bold",
        color: "#" + fg.toString(16).padStart(6, "0"),
      })
      .setOrigin(0.5);
    rect.on("pointerdown", onClick);
    this.ui.push(rect, text);
  }
}
