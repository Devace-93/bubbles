import "@fontsource/luckiest-guy/index.css";
import Phaser from "phaser";
import { startBubbleBackground } from "../bg";
import { getLang, isRtl, t } from "../i18n";
import { mountLangSelector } from "../langSelector";
import { openShare } from "../share";
import { getSoundSettings, mountSoundControl, type SoundSettings } from "../sound";
import { GAME_HEIGHT, GAME_WIDTH } from "./config";
import { PreloadScene } from "./PreloadScene";
import { GameScene } from "./GameScene";
import { EndScene } from "./EndScene";
import { loadVoices } from "./announcer";
import { LANG_CHANGE } from "./langChange";

startBubbleBackground(document.getElementById("bg") as HTMLCanvasElement);

function applyDomTexts(): void {
  const strings = t();
  document.documentElement.lang = getLang();
  document.documentElement.dir = isRtl() ? "rtl" : "ltr";
  document.title = strings.title;
  for (const el of document.querySelectorAll<HTMLElement>("[data-i18n]")) {
    const value = strings[el.dataset.i18n as keyof typeof strings];
    if (typeof value === "string") el.textContent = value;
  }
}
applyDomTexts();
document.getElementById("share-btn")!.addEventListener("click", () => openShare());

// Language changes apply in place: DOM texts, the selector's own button, the
// active scene's texts (via LANG_CHANGE) and the announcer clips.
let game: Phaser.Game | undefined;
function mountSelector(): void {
  // re-mounted on every change so the button shows the new flag/name
  mountLangSelector(document.getElementById("lang-sel")!, () => {
    applyDomTexts();
    mountSelector();
    if (!game) return;
    const active = game.scene.getScenes(true)[0];
    if (active) loadVoices(active);
    game.events.emit(LANG_CHANGE);
  });
}
mountSelector();

// Mute/volume live on Phaser's global SoundManager, so every sound effect and
// announcer line inherits them without per-call checks.
function applySound(settings: SoundSettings): void {
  if (!game) return;
  game.sound.mute = settings.muted;
  game.sound.volume = settings.volume;
}
mountSoundControl(document.getElementById("sound-ctl")!, applySound);

// Make sure the display font is usable inside the canvas before any text renders.
document.fonts.load('16px "Luckiest Guy"').finally(() => {
  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: "game",
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: "#0a4d6e",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [PreloadScene, GameScene, EndScene],
  });
  applySound(getSoundSettings());
  // dev only: lets the console poke at scenes (e.g. __game.scene.getScene("game"))
  if (import.meta.env.DEV) (window as unknown as { __game: Phaser.Game }).__game = game;
});
