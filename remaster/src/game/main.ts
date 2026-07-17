import "@fontsource/luckiest-guy/index.css";
import Phaser from "phaser";
import { startBubbleBackground } from "../bg";
import { t } from "../i18n";
import { mountLangSelector } from "../langSelector";
import { openShare } from "../share";
import { GAME_HEIGHT, GAME_WIDTH } from "./config";
import { PreloadScene } from "./PreloadScene";
import { GameScene } from "./GameScene";
import { EndScene } from "./EndScene";

startBubbleBackground(document.getElementById("bg") as HTMLCanvasElement);

const strings = t();
document.title = strings.title;
for (const el of document.querySelectorAll<HTMLElement>("[data-i18n]")) {
  const value = strings[el.dataset.i18n as keyof typeof strings];
  if (typeof value === "string") el.textContent = value;
}
document.getElementById("share-btn")!.addEventListener("click", () => openShare());
// language change re-renders canvas texts too, so a reload keeps it simple
mountLangSelector(document.getElementById("lang-sel")!, () => location.reload());

// Make sure the display font is usable inside the canvas before any text renders.
document.fonts.load('16px "Luckiest Guy"').finally(() => {
  new Phaser.Game({
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
});
