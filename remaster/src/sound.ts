// Site-wide sound settings (mute + volume) persisted per browser, and the
// small control that edits them. Applied to Phaser's SoundManager by
// game/main.ts, so sound effects and the voice announcer follow them alike.

const KEY = "bubbles.sound";

export interface SoundSettings {
  muted: boolean;
  volume: number; // 0..1
}

const DEFAULTS: SoundSettings = { muted: false, volume: 1 };

export function getSoundSettings(): SoundSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<SoundSettings> | null;
    if (!saved) return { ...DEFAULTS };
    const volume = Number(saved.volume);
    return {
      muted: saved.muted === true,
      volume: Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : DEFAULTS.volume,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function setSoundSettings(settings: SoundSettings): void {
  localStorage.setItem(KEY, JSON.stringify(settings));
}

// Styled like the language selector's pill so the two sit together.
const CSS = `
.sound-ctl {
  display: flex; align-items: center; gap: 8px;
  background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.45);
  border-radius: 999px; padding: 4px 10px 4px 6px; font-family: system-ui, sans-serif;
}
.sound-ctl button {
  background: none; border: none; color: #fff; cursor: pointer;
  font-size: 1.15em; line-height: 1; padding: 2px 4px;
}
.sound-ctl input[type="range"] { width: 84px; accent-color: #35d0ba; cursor: pointer; }
.sound-ctl.muted input[type="range"] { opacity: .4; }
@media (max-width: 640px) { .sound-ctl input[type="range"] { width: 60px; } }
`;

export function mountSoundControl(
  container: HTMLElement,
  onChange: (settings: SoundSettings) => void,
): void {
  if (!document.getElementById("sound-ctl-css")) {
    const style = document.createElement("style");
    style.id = "sound-ctl-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  const settings = getSoundSettings();
  container.classList.add("sound-ctl");
  container.innerHTML = `
    <button type="button" aria-label="Mute" aria-pressed="false"></button>
    <input type="range" min="0" max="100" step="5" aria-label="Volume" />`;
  const mute = container.querySelector<HTMLButtonElement>("button")!;
  const slider = container.querySelector<HTMLInputElement>("input")!;

  const render = (): void => {
    const silent = settings.muted || settings.volume === 0;
    mute.textContent = silent ? "🔇" : settings.volume < 0.5 ? "🔉" : "🔊";
    mute.setAttribute("aria-pressed", String(settings.muted));
    container.classList.toggle("muted", settings.muted);
    slider.value = String(Math.round(settings.volume * 100));
  };
  const commit = (): void => {
    setSoundSettings(settings);
    render();
    onChange({ ...settings });
  };

  mute.addEventListener("click", () => {
    settings.muted = !settings.muted;
    commit();
  });
  slider.addEventListener("input", () => {
    settings.volume = Number(slider.value) / 100;
    // touching the slider is an intent to hear something
    if (settings.muted && settings.volume > 0) settings.muted = false;
    commit();
  });
  render();
}
