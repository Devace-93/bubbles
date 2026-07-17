export type Lang = "en" | "es";

const STRINGS = {
  en: {
    tagline: "Pop the fruit. Beat the clock.",
    play: "PLAY",
    classic: "CLASSIC (2015)",
    howToTitle: "How to play",
    howPop: "POP fruits",
    howPopSub: "+50 pts each",
    howAvoid: "AVOID veggies",
    howAvoidSub: "−7 pts & streak reset",
    howTime: "GRAB berries",
    howTimeSub: "+5 seconds",
    howStreak: "CHAIN streaks",
    howStreakSub: "×3 ×9 ×12 bonus",
    challengeBanner: (score: number, streak: number) =>
      `A friend scored ${score} pts with a best streak of ${streak} — can you beat it?`,
    madeBy: "Made by Enrique",
    source: "Source on GitHub",
    share: "Share",
    // game
    seconds: (n: number) => `${n} seconds`,
    points: (n: number) => `${n} pts`,
    streak: (n: number) => `Streak: ${n}`,
    finalScore: "Final score",
    bestStreak: (n: number) => `Best streak: ${n}`,
    fruits: "Fruits",
    veggies: "Veggies",
    streakBonus: (n: number) => `Streaks of ${n}`,
    playAgain: "Play again",
    home: "Home",
    shareFb: "Share on Facebook",
    tapToStart: "Tap to start",
    back: "Back",
  },
  es: {
    tagline: "Revienta la fruta. Gana al reloj.",
    play: "JUGAR",
    classic: "CLÁSICO (2015)",
    howToTitle: "Cómo jugar",
    howPop: "REVIENTA frutas",
    howPopSub: "+50 pts cada una",
    howAvoid: "EVITA verduras",
    howAvoidSub: "−7 pts y pierdes la racha",
    howTime: "ATRAPA moras",
    howTimeSub: "+5 segundos",
    howStreak: "ENCADENA rachas",
    howStreakSub: "bono ×3 ×9 ×12",
    challengeBanner: (score: number, streak: number) =>
      `Alguien hizo ${score} pts con una racha de ${streak} — ¿puedes superarlo?`,
    madeBy: "Hecho por Enrique",
    source: "Código en GitHub",
    share: "Compartir",
    // game
    seconds: (n: number) => `${n} segundos`,
    points: (n: number) => `${n} pts`,
    streak: (n: number) => `Racha: ${n}`,
    finalScore: "Puntuación final",
    bestStreak: (n: number) => `Mejor racha: ${n}`,
    fruits: "Frutas",
    veggies: "Verduras",
    streakBonus: (n: number) => `Rachas de ${n}`,
    playAgain: "Jugar otra vez",
    home: "Inicio",
    shareFb: "Compartir en Facebook",
    tapToStart: "Toca para empezar",
    back: "Regresar",
  },
};

export type Strings = (typeof STRINGS)["en"];

const KEY = "bubbles.lang";

export function getLang(): Lang {
  const saved = localStorage.getItem(KEY);
  if (saved === "en" || saved === "es") return saved;
  return navigator.language.toLowerCase().startsWith("es") ? "es" : "en";
}

export function setLang(lang: Lang): void {
  localStorage.setItem(KEY, lang);
}

export function t(): Strings {
  return STRINGS[getLang()];
}
