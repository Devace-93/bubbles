# Bubbles 🫧

**Play it: <https://bubbles.3m4.net>**

A fruit-popping arcade mini-game. Bubbles rise from the bottom of the screen;
pop the fruit before the clock runs out, avoid the vegetables, and chain
streaks for bonus points.

The site ships two versions of the game:

| | Route | Stack |
|---|---|---|
| **Remastered** | [`/play/`](https://bubbles.3m4.net/play/) | Phaser 3 + TypeScript + Vite, original art, EN/ES |
| **Classic (2015)** | [`/classic/`](https://bubbles.3m4.net/classic/) | jQuery 1.8 + GSAP 1.13 + SoundJS 0.6, preserved as-is |

## How to play

- 🫧 **Pop fruits** — +50 pts each
- 🥦 **Avoid veggies** — −7 pts and your streak resets
- 🫐 **Grab blackberries** — +5 seconds on the clock
- 🔥 **Chain streaks** — bonus points at ×3 (+7), ×9 (+18) and ×12 (+30)

A round lasts 30 seconds, extendable up to 45 by catching blackberries.

## Development

Requires [bun](https://bun.sh).

```sh
bun install

bun run dev          # remastered game + homepage → http://localhost:5173
bun run dev:legacy   # classic game → http://localhost:8015

bun run build        # full site → dist/ (homepage + /play/ + /classic/)
```

### Docker

The whole site can be built and served as a container (bun build stage +
nginx):

```sh
docker compose up --build   # → http://localhost:8080
```

## Project structure

```
├─ legacy/     # the original 2015 game, kept behaviorally intact
│  ├─ scripts/copy-vendor.ts   # copies pinned libs from node_modules → vendor/
│  └─ vendor-static/           # SoundJS 0.6.0 (that version was never on npm)
├─ remaster/   # Vite multi-page app: homepage (/) + Phaser 3 game (/play/)
│  ├─ public/art/              # original SVG art (MIT, drawn for this project)
│  └─ src/game/                # scenes: Preload, Game, End
└─ .github/workflows/deploy.yml  # bun build → GitHub Pages (bubbles.3m4.net)
```

### Notes on the legacy version

- Its libraries (jQuery 1.8.3, GSAP 1.13.2) are installed by bun at the exact
  original versions and copied into `legacy/vendor/` at build time — they no
  longer live in the repo. SoundJS 0.6.0 was never published to npm, so that
  single file is committed under `legacy/vendor-static/`.
- `javascripts/scripts.js` is a hand-compiled bundle from 2015 (jQuery 1.11.3,
  underscore, jSmart, colorbox, …). It is treated as project source.
- DataTables was removed: `index.html` never loaded it.
- The original `img/back.jpg` background was already missing from the first
  commit; a CSS gradient in the same palette stands in for it.
- Game piece templates are compiled into `json/devolverPlantillas.json` by
  `bun run plantillas` (from `legacy/`).

### Sharing

The end screen shares your score to Facebook via the share dialog. The score
travels as URL parameters (`?score=…&streak=…`) and the homepage greets
challenged friends with a banner.

## Credits

- Game concept and classic implementation: 2015 campaign mini-game.
  Brand-specific artwork was removed from this repository; the classic
  version uses the original neutral shape sprites.
- Remaster art (fruits, vegetables, badges, bubble): original SVGs made for
  this project, MIT-licensed with the code.
- Sound effects: from the original 2015 game.
- Display font: [Luckiest Guy](https://fonts.google.com/specimen/Luckiest+Guy)
  (Apache 2.0), self-hosted via `@fontsource/luckiest-guy`. It replaced the
  commercial "Marujo" font the 2015 game used; legacy CSS keeps the old
  family alias.

## License

[MIT](LICENSE)
