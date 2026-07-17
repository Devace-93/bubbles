import { LANGS, getLang, setLang } from "./i18n";

// Language picker mirroring kinegram.3m4.net's: a button with the current
// flag + language name + caret, and a dropdown with a search box. Injects its
// own styles so it works on any page.
const CSS = `
.lang-sel { position: relative; font-family: system-ui, sans-serif; }
.lang-sel > button {
  display: flex; align-items: center; gap: 7px;
  background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.45);
  color: #fff; border-radius: 999px; padding: 6px 13px;
  font-weight: 700; cursor: pointer; font-size: .85em;
}
.lang-sel > button:hover { background: rgba(255,255,255,.28); }
.lang-sel > button .caret { opacity: .6; font-size: .8em; }
@media (max-width: 640px) { .lang-sel > button .lname { display: none; } }
.lang-sel .panel {
  position: absolute; top: calc(100% + 8px); right: 0; z-index: 60;
  background: #0c2b3f; border: 1px solid rgba(255,255,255,.3); border-radius: 12px;
  padding: 8px; min-width: 230px;
  box-shadow: 0 8px 24px rgba(0,0,0,.4);
}
.lang-sel .panel input {
  width: 100%; box-sizing: border-box; margin-bottom: 8px;
  background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.3);
  border-radius: 8px; color: #fff; padding: 6px 10px; font-size: .92em;
}
.lang-sel .panel input::placeholder { color: rgba(255,255,255,.5); }
.lang-sel .list { max-height: 288px; overflow-y: auto; }
.lang-sel .list button {
  display: flex; align-items: center; gap: 9px; width: 100%;
  background: none; border: none; color: #e8f1f7; cursor: pointer;
  padding: 7px 10px; border-radius: 8px; font-size: .92em; text-align: left;
}
.lang-sel .list button:hover { background: rgba(255,255,255,.12); }
.lang-sel .list button.active { background: rgba(53,208,186,.25); }
`;

const norm = (s: string): string =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

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
      <span>${current.flag}</span><span class="lname">${current.name}</span><span class="caret">▾</span>
    </button>
    <div class="panel" hidden>
      <input type="search" aria-label="Search" />
      <div class="list" role="listbox"></div>
    </div>`;

  const toggle = container.querySelector<HTMLButtonElement>(":scope > button")!;
  const panel = container.querySelector<HTMLElement>(".panel")!;
  const search = panel.querySelector<HTMLInputElement>("input")!;
  const list = panel.querySelector<HTMLElement>(".list")!;

  const render = (query: string): void => {
    const q = norm(query);
    const matches = LANGS.filter((l) => norm(`${l.name} ${l.code} ${l.alias}`).includes(q));
    list.innerHTML = matches
      .map(
        (l) =>
          `<button type="button" role="option" data-code="${l.code}"
            class="${l.code === current.code ? "active" : ""}">${l.flag} ${l.name}</button>`,
      )
      .join("");
  };
  render("");

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    panel.hidden = !panel.hidden;
    if (!panel.hidden) {
      search.value = "";
      render("");
      search.focus();
    }
  });
  panel.addEventListener("click", (e) => e.stopPropagation());
  document.addEventListener("click", () => {
    panel.hidden = true;
  });
  search.addEventListener("input", () => render(search.value));
  search.addEventListener("keydown", (e) => {
    if (e.key === "Escape") panel.hidden = true;
    if (e.key === "Enter") {
      const first = list.querySelector<HTMLElement>("[data-code]");
      if (first) first.click();
    }
  });
  list.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-code]");
    if (!btn) return;
    setLang(btn.dataset.code!);
    panel.hidden = true;
    onChange();
  });
}
