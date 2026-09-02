// Announcer lines shared by the build-time generator (scripts/generate-voices.ts)
// and the in-game announcer (game/announcer.ts). No Phaser imports here so the
// bun script can load it directly.

import { CATALOG } from "./i18n/catalog";

// Announcer event → catalog key. The file slug is derived from the event name
// (e.g. levelUp → level-up.es.mp3).
export const VOICE_LINES = {
  gameStart: "voiceGameStart",
  levelUp: "voiceLevelUp",
  gameOver: "voiceGameOver",
  newHighScore: "voiceNewHighScore",
} as const;

export type VoiceKey = keyof typeof VOICE_LINES;
const VOICE_KEYS = Object.values(VOICE_LINES);

// Candidate locales: every base language in the catalog, plus country variants
// that define their own announcer lines (es-MX). Whether a candidate actually
// gets voiced is decided by the generator (ElevenLabs language support) and,
// at runtime, by which clips exist (see voiceLocale).
export const VOICE_LOCALES: readonly string[] = Object.keys(CATALOG).filter(
  (code) => code.length === 2 || VOICE_KEYS.some((k) => k in CATALOG[code]),
);

export type VoiceLocale = string;

// Picks the clip set for a player's locale from the ones that exist, with
// the same fallback as the text catalog: country variant → base language →
// English.
export function voiceLocale(lang: string, voiced: readonly string[]): VoiceLocale {
  if (voiced.includes(lang)) return lang;
  const base = lang.slice(0, 2);
  if (voiced.includes(base)) return base;
  return "en";
}

export function voiceSlug(key: VoiceKey): string {
  return key.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());
}

// Public path of a generated clip, served from remaster/public/voices/.
export function voiceFile(key: VoiceKey, locale: VoiceLocale): string {
  return `${voiceSlug(key)}.${locale}.mp3`;
}

// Same per-key fallback as the text catalog: country variant → base language.
export function voiceText(key: VoiceKey, locale: VoiceLocale): string | undefined {
  const k = VOICE_LINES[key];
  return CATALOG[locale]?.[k] ?? CATALOG[locale.slice(0, 2)]?.[k];
}
