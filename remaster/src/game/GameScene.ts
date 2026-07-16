import Phaser from "phaser";
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  GOOD_RATIO,
  HARD_STOP_SECONDS,
  POINTS_BAD,
  POINTS_GOOD,
  ROUND_SECONDS,
  SIREN_AT_SECONDS,
  SPAWN_MAX,
  SPAWN_MIN,
  SPEED,
  SPRITES,
  STREAK_BONUS,
  TIME_BONUS_SECONDS,
  TIME_ITEMS,
  TIME_ITEM_SPEED_FACTOR,
  type ItemKind,
  type RoundResult,
} from "./config";
import { t } from "../i18n";

interface SpawnEntry {
  at: number; // seconds from round start
  kind: ItemKind;
}

export class GameScene extends Phaser.Scene {
  private score = 0;
  private displayedScore = 0;
  private streak = 0;
  private bestStreak = 0;
  private goodCount = 0;
  private badCount = 0;
  private streakCounts = { 3: 0, 9: 0, 12: 0 };
  private timeLimit = ROUND_SECONDS;
  private elapsed = 0;
  private running = false;
  private ended = false;
  private sirenPlaying = false;
  private spawnQueue: SpawnEntry[] = [];
  private items!: Phaser.GameObjects.Group;
  private scoreText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private streakText!: Phaser.GameObjects.Text;

  constructor() {
    super("game");
  }

  create(): void {
    this.resetState();
    this.createBackground();
    this.createHud();
    this.items = this.add.group();
    this.buildSpawnQueue();
    this.countdown(3);
  }

  private resetState(): void {
    this.score = 0;
    this.displayedScore = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.goodCount = 0;
    this.badCount = 0;
    this.streakCounts = { 3: 0, 9: 0, 12: 0 };
    this.timeLimit = ROUND_SECONDS;
    this.elapsed = 0;
    this.running = false;
    this.ended = false;
    this.sirenPlaying = false;
    this.spawnQueue = [];
  }

  // ── Background: layered aquatic scene (the "better background") ──────────

  private createBackground(): void {
    const g = this.add.graphics();
    g.fillGradientStyle(0x0a4d6e, 0x0a4d6e, 0x35d0ba, 0x2ab7a9, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // soft light rays
    for (let i = 0; i < 4; i++) {
      const ray = this.add.triangle(
        150 + i * 180,
        0,
        0,
        0,
        90 + i * 12,
        0,
        -160,
        GAME_HEIGHT,
        0xffffff,
        0.05,
      );
      this.tweens.add({
        targets: ray,
        x: ray.x + 40,
        alpha: 0.02,
        duration: 4000 + i * 900,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    // rising fizz
    const fizz = this.add.graphics();
    fizz.fillStyle(0xffffff, 0.6);
    fizz.fillCircle(3, 3, 3);
    fizz.generateTexture("fizz", 6, 6);
    fizz.destroy();
    this.add.particles(0, 0, "fizz", {
      x: { min: 0, max: GAME_WIDTH },
      y: GAME_HEIGHT + 10,
      lifespan: 9000,
      speedY: { min: -60, max: -25 },
      speedX: { min: -12, max: 12 },
      scale: { start: 0.4, end: 1.1 },
      alpha: { start: 0.35, end: 0 },
      quantity: 1,
      frequency: 350,
    });
  }

  private createHud(): void {
    const style = {
      fontFamily: "system-ui, sans-serif",
      fontStyle: "bold",
      color: "#ffffff",
    };
    const hud = this.add.rectangle(GAME_WIDTH / 2, 54, GAME_WIDTH - 24, 88, 0x03293d, 0.55);
    hud.setStrokeStyle(2, 0xffffff, 0.25).setDepth(50);
    this.timerText = this.add.text(28, 22, "", { ...style, fontSize: "34px" }).setDepth(51);
    this.scoreText = this.add
      .text(GAME_WIDTH - 28, 22, "", { ...style, fontSize: "34px", color: "#ffb347" })
      .setOrigin(1, 0)
      .setDepth(51);
    this.streakText = this.add
      .text(28, 60, "", { ...style, fontSize: "24px", color: "#8ee6d8" })
      .setDepth(51);
    this.updateHud();
  }

  private updateHud(): void {
    const s = t();
    const remaining = Math.max(0, Math.round(this.timeLimit - this.elapsed));
    this.timerText.setText(s.seconds(remaining));
    this.scoreText.setText(s.points(Math.round(this.displayedScore)));
    this.streakText.setText(s.streak(this.streak));
  }

  // ── Round setup: same distribution as legacy generarBurbujas() ───────────

  private buildSpawnQueue(): void {
    const count = Phaser.Math.Between(SPAWN_MIN, SPAWN_MAX);
    const window = ROUND_SECONDS + TIME_ITEMS * TIME_BONUS_SECONDS; // 45 s
    for (let i = 0; i < count; i++) {
      this.spawnQueue.push({
        at: Math.random() * window,
        kind: Math.random() < GOOD_RATIO ? "good" : "bad",
      });
    }
    for (let i = 0; i < TIME_ITEMS; i++) {
      this.spawnQueue.push({ at: Math.random() * ROUND_SECONDS, kind: "time" });
    }
    this.spawnQueue.sort((a, b) => a.at - b.at);
  }

  private countdown(n: number): void {
    if (n === 0) {
      this.running = true;
      return;
    }
    this.sound.play("BEEP");
    const num = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, String(n), {
        fontFamily: '"Luckiest Guy", system-ui, sans-serif',
        fontSize: "220px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setDepth(60);
    this.tweens.add({
      targets: num,
      scale: 0.05,
      duration: 900,
      ease: "Linear",
      onComplete: () => {
        num.destroy();
        this.countdown(n - 1);
      },
    });
  }

  update(_time: number, deltaMs: number): void {
    if (!this.running || this.ended) return;
    this.elapsed += deltaMs / 1000;

    while (this.spawnQueue.length && this.spawnQueue[0].at <= this.elapsed) {
      this.spawnItem(this.spawnQueue.shift()!.kind);
    }

    const remaining = this.timeLimit - this.elapsed;
    if (remaining <= SIREN_AT_SECONDS && !this.sirenPlaying && remaining > 0) {
      this.sirenPlaying = true;
      this.sound.play("SIRENA", { loop: true });
    }
    if (remaining <= 0 || this.elapsed >= HARD_STOP_SECONDS) {
      this.endRound();
    }
    this.updateHud();
  }

  // ── Items ─────────────────────────────────────────────────────────────────

  private travelSeconds(kind: ItemKind): number {
    // legacy getVelocidad(): linear interpolation over the round + hurry mode
    let f = SPEED.start;
    let i = SPEED.end;
    let at = this.elapsed;
    if (at > ROUND_SECONDS) {
      f = SPEED.end;
      i = SPEED.hurry;
      at -= ROUND_SECONDS;
    }
    let duration = f - (at / ROUND_SECONDS) * (f - i);
    if (kind === "time") duration *= TIME_ITEM_SPEED_FACTOR;
    duration += (Math.random() - 0.5) * 0.2 * duration;
    return duration;
  }

  private createItem(
    kind: ItemKind,
    key: string,
    x: number,
    y: number,
  ): Phaser.GameObjects.Container {
    const fruit = this.add.image(0, 0, key);
    fruit.setScale(110 / fruit.height);
    const bubble = this.add.image(0, 0, "bubble");
    bubble.setScale(170 / bubble.height).setAlpha(0.85);

    const item = this.add.container(x, y, [fruit, bubble]);
    item.setSize(170, 170);
    item.setData({ kind, sprite: key, popped: false });
    // container hit areas are in size-box space: (0,0) is the top-left corner
    item.setInteractive(
      new Phaser.Geom.Circle(85, 85, 85),
      Phaser.Geom.Circle.Contains,
    );
    this.items.add(item);
    return item;
  }

  private spawnItem(kind: ItemKind): void {
    const sprites = SPRITES[kind];
    const key = sprites[Math.floor(Math.random() * sprites.length)];
    const x = Phaser.Math.Between(60, GAME_WIDTH - 60);

    const item = this.createItem(kind, key, x, GAME_HEIGHT + 90);
    item.on("pointerdown", () => this.popItem(item));

    const duration = this.travelSeconds(kind) * 1000 * 3; // full travel; legacy time was per-483px
    const wobble = Phaser.Math.Between(20, 55);
    this.tweens.add({
      targets: item,
      y: -120,
      duration,
      ease: "Linear",
      onComplete: () => item.destroy(),
    });
    this.tweens.add({
      targets: item,
      x: x + wobble,
      duration: Phaser.Math.Between(700, 1300),
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private popItem(item: Phaser.GameObjects.Container, silent = false): void {
    if (this.ended && !silent) return;
    if (item.getData("popped")) return;
    item.setData("popped", true);
    const kind = item.getData("kind") as ItemKind;

    this.tweens.killTweensOf(item);

    // burst ring
    const ring = this.add.circle(item.x, item.y, 40, 0xffffff, 0);
    ring.setStrokeStyle(6, 0xffffff, 0.9);
    this.tweens.add({
      targets: ring,
      radius: 110,
      alpha: 0,
      duration: 280,
      onComplete: () => ring.destroy(),
    });
    item.destroy();
    if (silent) return;

    // badge popup (same +50 / −7 / +5 s art as legacy)
    const badgeKey = kind === "good" ? "badge_plus50" : kind === "bad" ? "badge_minus7" : "badge_plus5s";
    const badge = this.add.image(item.x, item.y, badgeKey).setScale(0.4);
    this.tweens.add({
      targets: badge,
      scale: 1.4,
      alpha: 0,
      y: item.y - 60,
      duration: 550,
      ease: "Sine.easeOut",
      onComplete: () => badge.destroy(),
    });

    if (kind === "good") this.onGood();
    else if (kind === "bad") this.onBad();
    else this.onTime();
    this.updateHud();
  }

  private scoreTween?: Phaser.Tweens.Tween;

  private tweenScore(): void {
    this.scoreTween?.remove();
    this.scoreTween = this.tweens.add({
      targets: this,
      displayedScore: this.score,
      duration: 400,
      ease: "Linear",
    });
  }

  private onGood(): void {
    this.sound.play("MAS2");
    this.score += POINTS_GOOD;
    this.goodCount++;
    this.streak++;
    if (this.streak > this.bestStreak) this.bestStreak = this.streak;
    // same precedence as legacy: ×12 beats ×9 beats ×3
    if (this.streak % 12 === 0) {
      this.sound.play("RACHA12");
      this.streakCounts[12]++;
    } else if (this.streak % 9 === 0) {
      this.sound.play("RACHA9");
      this.streakCounts[9]++;
    } else if (this.streak % 3 === 0) {
      this.sound.play("RACHA3");
      this.streakCounts[3]++;
    }
    this.tweenScore();
  }

  private onBad(): void {
    this.sound.play("MENOS");
    if (this.streak >= 9) this.sound.play("FINRACHA");
    this.score += POINTS_BAD;
    this.badCount++;
    this.streak = 0;
    this.cameras.main.shake(120, 0.004);
    this.tweenScore();
  }

  private onTime(): void {
    this.sound.play("TIEMPO");
    this.timeLimit = Math.min(this.timeLimit + TIME_BONUS_SECONDS, HARD_STOP_SECONDS);
    if (this.sirenPlaying && this.timeLimit - this.elapsed > SIREN_AT_SECONDS) {
      this.sound.stopByKey("SIRENA");
      this.sirenPlaying = false;
    }
    this.timerText.setAlpha(0);
    this.tweens.add({ targets: this.timerText, alpha: 1, duration: 200, repeat: 2, yoyo: true });
  }

  // ── End of round ──────────────────────────────────────────────────────────

  private endRound(): void {
    if (this.ended) return;
    this.ended = true;
    this.running = false;
    this.sound.stopByKey("SIRENA");
    this.sound.play("FINAL");

    for (const item of [...this.items.getChildren()] as Phaser.GameObjects.Container[]) {
      if (item.active) this.popItem(item, true);
    }

    // streak bonuses are added at the end, like legacy
    this.score +=
      this.streakCounts[3] * STREAK_BONUS[3] +
      this.streakCounts[9] * STREAK_BONUS[9] +
      this.streakCounts[12] * STREAK_BONUS[12];

    const result: RoundResult = {
      score: this.score,
      bestStreak: this.bestStreak,
      goodCount: this.goodCount,
      badCount: this.badCount,
      streakCounts: { ...this.streakCounts },
    };
    this.time.delayedCall(900, () => this.scene.start("end", result));
  }
}
