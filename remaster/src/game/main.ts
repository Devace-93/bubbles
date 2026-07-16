import "@fontsource/luckiest-guy/index.css";
import Phaser from "phaser";
import { startBubbleBackground } from "../bg";
import { GAME_HEIGHT, GAME_WIDTH } from "./config";
import { PreloadScene } from "./PreloadScene";
import { GameScene } from "./GameScene";
import { EndScene } from "./EndScene";

startBubbleBackground(document.getElementById("bg") as HTMLCanvasElement);

// Make sure the display font is usable inside the canvas before any text renders.
document.fonts.load('16px "Luckiest Guy"').finally(() => {
  const game = new Phaser.Game({
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
  // debugging/testing handle
  (window as unknown as { __game: Phaser.Game }).__game = game;
});
