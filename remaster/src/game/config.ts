// Gameplay constants ported 1:1 from legacy/javascripts/burbujas.js.

export const GAME_WIDTH = 768;
export const GAME_HEIGHT = 1024;

export const ROUND_SECONDS = 30;
export const TIME_BONUS_SECONDS = 5; // per berry popped ("bonificacionBotellas")
export const TIME_ITEMS = 3;
export const HARD_STOP_SECONDS = 45; // legacy setTimeout(estallarTodas, 45000)

export const SPAWN_MIN = 120;
export const SPAWN_MAX = 130;
export const GOOD_RATIO = 0.65; // legacy: rnd >= .35 → good

export const POINTS_GOOD = 50;
export const POINTS_BAD = -7;
export const STREAK_BONUS = { 3: 7, 9: 18, 12: 30 } as const;

// Travel duration (seconds, bottom → top) interpolates over the round,
// legacy getVelocidad(): desktop 3 → 2.5, hurry (t > 30 s) 2.5 → 2.4.
export const SPEED = { start: 3, end: 2.5, hurry: 2.4 };
export const TIME_ITEM_SPEED_FACTOR = 0.75; // berries fall 25% faster

export const SIREN_AT_SECONDS = 6;

export type ItemKind = "good" | "bad" | "time";

// Original art (remaster/public/art/) — fruits score, vegetables penalize,
// the blackberry adds time (as "mora" did in the legacy game).
export const SPRITES: Record<ItemKind, string[]> = {
  good: ["strawberry", "apple", "orange", "pear", "banana", "watermelon"],
  bad: ["broccoli", "carrot", "onion"],
  time: ["blackberry"],
};

// Same event → sound-file mapping as legacy/javascripts/recursos.js
export const SOUNDS: Record<string, string> = {
  MAS2: "puntuar.mp3",
  TIEMPO: "time.mp3",
  MENOS: "down.mp3",
  RACHA3: "ding.mp3",
  RACHA9: "winner.mp3",
  RACHA12: "applause.mp3",
  FINRACHA: "bah.mp3",
  BEEP: "beep.mp3",
  SIRENA: "sirena.mp3",
  FINAL: "wrong.mp3",
  WOW: "wow.mp3",
};

export interface RoundResult {
  score: number;
  bestStreak: number;
  goodCount: number;
  badCount: number;
  streakCounts: { 3: number; 9: number; 12: number };
}
