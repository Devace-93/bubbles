import { CATALOG, LANGS, RTL_LANGS, fmt } from "./i18n/catalog";

export type Lang = string;

const KEY = "bubbles.lang";

export function getLang(): Lang {
  const saved = localStorage.getItem(KEY);
  if (saved && CATALOG[saved]) return saved;
  const nav = (navigator.language || "en").toLowerCase();
  const base = nav.slice(0, 2);
  if (CATALOG[base]) return base;
  return "en";
}

export function setLang(lang: Lang): void {
  localStorage.setItem(KEY, lang);
}

export function isRtl(lang: Lang = getLang()): boolean {
  return RTL_LANGS.includes(lang);
}

export { LANGS };

function get(key: string): string {
  const c = CATALOG[getLang()] ?? CATALOG.en;
  return c[key] ?? CATALOG.en[key] ?? key;
}

export interface Strings {
  title: string;
  description: string;
  classicTitle: string;
  tagline: string;
  play: string;
  classic: string;
  howToTitle: string;
  howPop: string;
  howPopSub: string;
  howAvoid: string;
  howAvoidSub: string;
  howTime: string;
  howTimeSub: string;
  howStreak: string;
  howStreakSub: string;
  challengeBanner: (score: number, streak: number) => string;
  madeBy: string;
  source: string;
  share: string;
  seconds: (n: number) => string;
  points: (n: number) => string;
  streak: (n: number) => string;
  finalScore: string;
  bestStreak: (n: number) => string;
  fruits: string;
  veggies: string;
  streakBonus: (n: number) => string;
  playAgain: string;
  home: string;
  shareFb: string;
  tapToStart: string;
  back: string;
}

export function t(): Strings {
  return {
    title: get("title"),
    description: get("description"),
    classicTitle: get("classicTitle"),
    tagline: get("tagline"),
    play: get("play"),
    classic: get("classic"),
    howToTitle: get("howToTitle"),
    howPop: get("howPop"),
    howPopSub: get("howPopSub"),
    howAvoid: get("howAvoid"),
    howAvoidSub: get("howAvoidSub"),
    howTime: get("howTime"),
    howTimeSub: get("howTimeSub"),
    howStreak: get("howStreak"),
    howStreakSub: get("howStreakSub"),
    challengeBanner: (score, streak) => fmt(get("challengeBanner"), { score, streak }),
    madeBy: get("madeBy"),
    source: get("source"),
    share: get("share"),
    seconds: (n) => fmt(get("seconds"), { n }),
    points: (n) => fmt(get("points"), { n }),
    streak: (n) => fmt(get("streak"), { n }),
    finalScore: get("finalScore"),
    bestStreak: (n) => fmt(get("bestStreak"), { n }),
    fruits: get("fruits"),
    veggies: get("veggies"),
    streakBonus: (n) => fmt(get("streakBonus"), { n }),
    playAgain: get("playAgain"),
    home: get("home"),
    shareFb: get("shareFb"),
    tapToStart: get("tapToStart"),
    back: get("back"),
  };
}
