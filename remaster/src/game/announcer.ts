import Phaser from "phaser";
import { getLang } from "../i18n";
import { VOICE_LINES, voiceFile, voiceLocale, type VoiceKey } from "../voiceLines";

// AI voice announcer. Clips are pre-generated mp3s (scripts/generate-voices.ts),
// so at runtime this is plain audio playback through Phaser's SoundManager —
// which means the global mute/volume settings apply to the voice as well.

const cacheKey = (locale: string, key: VoiceKey): string => `voice:${locale}:${key}`;

const currentLocale = (): string => voiceLocale(getLang(), __VOICED_LOCALES__);

// Queues the current locale's clips (4 small files) that are not cached yet.
// __VOICED_LOCALES__ is injected by vite.config.ts from the clips on disk, so
// a locale without generated clips falls back to its base language or English
// instead of requesting files that do not exist.
export function preloadVoices(scene: Phaser.Scene): void {
  const locale = currentLocale();
  for (const key of Object.keys(VOICE_LINES) as VoiceKey[]) {
    const k = cacheKey(locale, key);
    if (!scene.cache.audio.exists(k)) scene.load.audio(k, `/voices/${voiceFile(key, locale)}`);
  }
}

// Same, but from a running scene (after a language change): the loader has
// to be started by hand outside of preload().
export function loadVoices(scene: Phaser.Scene): void {
  preloadVoices(scene);
  if (!scene.load.isLoading()) scene.load.start();
}

let current: Phaser.Sound.BaseSound | undefined;

// Plays a line, waiting for the one currently being spoken to finish so lines
// never overlap (e.g. "game over" followed by "new high score" on the end
// screen). Silently no-ops when the clip was not generated, so the game keeps
// working without an ElevenLabs key.
export function announce(scene: Phaser.Scene, key: VoiceKey): void {
  const k = cacheKey(currentLocale(), key);
  if (!scene.cache.audio.exists(k)) return;
  const play = (): void => {
    const sound = scene.sound.add(k);
    current = sound;
    sound.once(Phaser.Sound.Events.COMPLETE, () => {
      if (current === sound) current = undefined;
      sound.destroy();
    });
    sound.play();
  };
  if (current?.isPlaying) current.once(Phaser.Sound.Events.COMPLETE, play);
  else play();
}
