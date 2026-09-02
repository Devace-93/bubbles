import Phaser from "phaser";

// Emitted on game.events when the player picks another language.
export const LANG_CHANGE = "langchange";

// Runs `handler` whenever the player switches language while `scene` is
// alive; unsubscribes when the scene shuts down (scene.start / restart).
export function onLangChange(scene: Phaser.Scene, handler: () => void): void {
  scene.game.events.on(LANG_CHANGE, handler);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.game.events.off(LANG_CHANGE, handler));
}
