#!/usr/bin/env bun
// Generates the in-game announcer clips with the ElevenLabs text-to-speech API.
//
//   bun run voices              # from the repo root; reads ELEVENLABS_API_KEY from .env
//   bun run voices --dry-run    # list what would be generated, no API calls
//   bun run voices --locale es  # only one locale (delete its mp3s first to redo them)
//
// Lines come from the i18n catalog (remaster/src/i18n/catalog.ts, keys
// voice*), for the locales in VOICE_LOCALES. Output goes to
// remaster/public/voices/<event>.<locale>.mp3 and is committed, so neither the
// Vite build nor CI needs the key. Existing files are skipped: re-running is
// free unless you delete a clip or add a new line.

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  VOICE_LINES,
  VOICE_LOCALES,
  voiceFile,
  voiceText,
  type VoiceKey,
  type VoiceLocale,
} from "../remaster/src/voiceLines";

const API = "https://api.elevenlabs.io/v1";
const OUT_DIR = resolve(import.meta.dirname, "../remaster/public/voices");

// eleven_v3: the most expressive model (70+ languages) and, unlike
// multilingual_v2, it honors language_code, so the language is enforced rather
// than guessed from the text. v2 guessed wrong on the Spanish "¡…!" lines and
// read the punctuation aloud. Billed at 1 credit per character.
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID ?? "eleven_v3";

// Premade voice "Charlie" (deep, confident, energetic) for every language:
// premade voices are usable on the free plan and v3 speaks all supported
// languages with them. Library voices need a paid plan via the API
// (402 paid_plan_required on the free tier). Override the voice for one
// locale with ELEVENLABS_VOICE_ID_<LOCALE> (e.g. ELEVENLABS_VOICE_ID_ES_MX)
// or for all of them with ELEVENLABS_VOICE_ID.
const DEFAULT_VOICE_ID = "IKne3meq5aSn9XLyUdCD";
function voiceIdFor(locale: VoiceLocale): string {
  const envKey = `ELEVENLABS_VOICE_ID_${locale.toUpperCase().replace("-", "_")}`;
  return process.env[envKey] ?? process.env.ELEVENLABS_VOICE_ID ?? DEFAULT_VOICE_ID;
}

// mp3_44100_128 is the default and the best mp3 the free tier allows
// (192 kbps needs Creator+). Plenty for one-second announcer clips.
const OUTPUT_FORMAT = "mp3_44100_128";

const dryRun = process.argv.includes("--dry-run");
const onlyLocale = process.argv[process.argv.indexOf("--locale") + 1] as string | undefined;
const wanted = VOICE_LOCALES.filter((l) => !process.argv.includes("--locale") || l === onlyLocale);
if (wanted.length === 0) {
  console.error(`--locale must be one of: ${VOICE_LOCALES.join(", ")}`);
  process.exit(1);
}
const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey && !dryRun) {
  console.error("ELEVENLABS_API_KEY is not set. Put it in .env (gitignored) or export it.");
  process.exit(1);
}

// Every request authenticates with the xi-api-key header (no OAuth, no bearer).
const authHeaders = { "xi-api-key": apiKey ?? "" };

interface Subscription {
  character_count: number; // credits used in the current billing period
  character_limit: number; // plan quota for the period (10,000 on the free tier)
}

// GET /v1/user/subscription reports usage; sampled before and after so the
// summary can show exactly what this run cost. API keys can be restricted per
// endpoint group: a key without the "User: Read" permission gets a 401 here
// while text-to-speech still works, so this is best-effort.
async function getSubscription(): Promise<Subscription | undefined> {
  const res = await fetch(`${API}/user/subscription`, { headers: authHeaders });
  if (res.status === 401 || res.status === 403) {
    console.warn("(usage check skipped: the API key lacks the User: Read permission)");
    return undefined;
  }
  if (!res.ok) throw new Error(`subscription: ${res.status} ${await res.text()}`);
  return (await res.json()) as Subscription;
}

// GET /v1/models lists every model with the languages it can speak (ISO
// 639-1 ids). Catalog languages outside that list are skipped, not voiced.
async function supportedLanguages(): Promise<Set<string> | undefined> {
  if (dryRun && !apiKey) return undefined;
  const res = await fetch(`${API}/models`, { headers: authHeaders });
  if (!res.ok) throw new Error(`models: ${res.status} ${await res.text()}`);
  const models = (await res.json()) as Array<{ model_id: string; languages: Array<{ language_id: string }> }>;
  const model = models.find((m) => m.model_id === MODEL_ID);
  if (!model) throw new Error(`model ${MODEL_ID} not available to this account`);
  return new Set(model.languages.map((l) => l.language_id));
}

// POST /v1/text-to-speech/{voice_id} returns the raw audio bytes (not JSON),
// in the codec/bitrate chosen with the output_format query parameter.
async function synthesize(text: string, locale: VoiceLocale): Promise<ArrayBuffer> {
  const url = `${API}/text-to-speech/${voiceIdFor(locale)}?output_format=${OUTPUT_FORMAT}`;
  // v3 only accepts stability 0.0 (creative), 0.5 (natural) or 1.0 (robust)
  // and ignores style/speaker boost; the v2 models take the finer knobs.
  const voice_settings = MODEL_ID.startsWith("eleven_v3")
    ? { stability: 0.5, similarity_boost: 0.8 }
    : { stability: 0.4, similarity_boost: 0.8, style: 0.6, use_speaker_boost: true };
  const res = await fetch(url, {
    method: "POST",
    headers: { ...authHeaders, "content-type": "application/json", accept: "audio/mpeg" },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      // ISO 639-1 (two letters, so "es-MX" → "es"); enforces the language on
      // v3/turbo/flash, ignored by v2. Regional flavor comes from the text
      // (and the chosen voice), not from this parameter.
      language_code: locale.slice(0, 2),
      voice_settings,
    }),
  });
  if (!res.ok) throw new Error(`text-to-speech: ${res.status} ${await res.text()}`);
  return res.arrayBuffer();
}

async function main(): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true });
  const supported = await supportedLanguages();
  const locales = wanted.filter((l) => {
    if (supported && !supported.has(l.slice(0, 2))) {
      console.log(`skipping ${l}: not supported by ${MODEL_ID}`);
      return false;
    }
    return true;
  });
  const before = dryRun ? undefined : await getSubscription();

  let generated = 0;
  let skipped = 0;
  let chars = 0;
  // Sequential on purpose: the free tier allows only 2 concurrent requests.
  for (const locale of locales) {
    for (const key of Object.keys(VOICE_LINES) as VoiceKey[]) {
      const file = voiceFile(key, locale);
      const path = resolve(OUT_DIR, file);
      if (existsSync(path)) {
        skipped++;
        continue;
      }
      const text = voiceText(key, locale);
      if (!text) {
        console.log(`skipping ${file}: no ${VOICE_LINES[key]} in the catalog`);
        continue;
      }
      chars += text.length;
      console.log(`${dryRun ? "would generate" : "generating"}  ${file}  "${text}"`);
      if (dryRun) continue;
      writeFileSync(path, new Uint8Array(await synthesize(text, locale)));
      generated++;
    }
  }

  console.log(`\n${generated} generated, ${skipped} skipped (already exist), ${chars} characters${dryRun ? " (dry run)" : ""}`);
  const after = before && (await getSubscription());
  if (before && after) {
    console.log(`Credits used by this run: ${after.character_count - before.character_count}`);
    console.log(`Credits used this period: ${after.character_count} / ${after.character_limit}`);
  } else if (!dryRun) {
    // eleven_multilingual_v2 bills 1 credit per character, so this is exact
    // unless ElevenLabs applies a minimum charge per request.
    console.log(`Credits used by this run (estimated from characters): ${chars}`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
