import { LANGS, getLang, setLang } from "./i18n";

// Header language selector: globe button showing the current flag, dropdown
// with every supported language. Injects its own styles so it works on any page.
const CSS = `
.lang-sel { position: relative; font-family: system-ui, sans-serif; }
.lang-sel > button {
  display: flex; align-items: center; gap: 7px;
  background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.45);
  color: #fff; border-radius: 999px; padding: 6px 13px;
  font-weight: 700; cursor: pointer; font-size: .85em;
}
.lang-sel > button:hover { background: rgba(255,255,255,.28); }
.lang-sel svg { width: 17px; height: 17px; }
.lang-sel .panel {
  position: absolute; top: calc(100% + 8px); right: 0; z-index: 60;
  background: #0c2b3f; border: 1px solid rgba(255,255,255,.3); border-radius: 12px;
  padding: 6px; max-height: 320px; overflow-y: auto; min-width: 210px;
  box-shadow: 0 8px 24px rgba(0,0,0,.4);
}
.lang-sel .panel button {
  display: flex; align-items: center; gap: 9px; width: 100%;
  background: none; border: none; color: #e8f1f7; cursor: pointer;
  padding: 7px 10px; border-radius: 8px; font-size: .92em; text-align: left;
}
.lang-sel .panel button:hover { background: rgba(255,255,255,.12); }
.lang-sel .panel button.active { background: rgba(53,208,186,.25); }
`;

const GLOBE =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
  '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z"/></svg>';

export function mountLangSelector(container: HTMLElement, onChange: () => void): void {
  if (!document.getElementById("lang-sel-css")) {
    const style = document.createElement("style");
    style.id = "lang-sel-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  container.classList.add("lang-sel");
  const current = LANGS.find((l) => l.code === getLang()) ?? LANGS[1];
  container.innerHTML = `
    <button type="button" aria-haspopup="listbox" aria-label="Language">
      ${GLOBE}<span>${current.flag} ${current.code.toUpperCase()}</span>
    </button>
    <div class="panel" role="listbox" hidden></div>`;

  const toggle = container.querySelector<HTMLButtonElement>(":scope > button")!;
  const panel = container.querySelector<HTMLElement>(".panel")!;
  panel.innerHTML = LANGS.map(
    (l) =>
      `<button type="button" role="option" data-code="${l.code}"
        class="${l.code === current.code ? "active" : ""}">${l.flag} ${l.name}</button>`,
  ).join("");

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    panel.hidden = !panel.hidden;
  });
  document.addEventListener("click", () => {
    panel.hidden = true;
  });
  panel.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-code]");
    if (!btn) return;
    setLang(btn.dataset.code!);
    panel.hidden = true;
    onChange();
  });
}
