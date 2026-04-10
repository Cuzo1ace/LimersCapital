/**
 * ElevenLabs voiceover generator.
 *
 * Usage:
 *   cd remotion
 *   node --experimental-strip-types src/scripts/generate-voiceover.ts [script]
 *
 * Where [script] is one of: walkthrough | colosseum | social | all (default: all)
 *
 * Reads ELEVENLABS_API_KEY from .env.local in the repo root.
 * Writes MP3 files to remotion/public/voiceover/{scriptName}/{lineId}.mp3
 */
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  WALKTHROUGH_SCRIPT,
  COLOSSEUM_SCRIPT,
  SOCIAL_SCRIPT,
  VOICE_IDS,
  VOICE_SETTINGS,
  type VOLine,
} from '../data/voiceover-scripts.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '../../..');
const PUBLIC_DIR = resolve(__dirname, '../../public/voiceover');

// Load .env.local manually (no dotenv dep needed)
function loadEnv(): Record<string, string> {
  const envPath = resolve(REPO_ROOT, '.env.local');
  if (!existsSync(envPath)) return {};
  const content = readFileSync(envPath, 'utf8');
  const env: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
  return env;
}

const env = { ...process.env, ...loadEnv() };
const API_KEY = env.ELEVENLABS_API_KEY;

if (!API_KEY) {
  console.error('❌ ELEVENLABS_API_KEY not found in .env.local or process.env');
  process.exit(1);
}

const SCRIPTS: Record<string, VOLine[]> = {
  walkthrough: WALKTHROUGH_SCRIPT,
  colosseum: COLOSSEUM_SCRIPT,
  social: SOCIAL_SCRIPT,
};

async function generateLine(line: VOLine, scriptName: string): Promise<boolean> {
  const outDir = resolve(PUBLIC_DIR, scriptName);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const outPath = resolve(outDir, `${line.id}.mp3`);
  if (existsSync(outPath)) {
    console.log(`  ⏭  ${line.id} (cached)`);
    return true;
  }

  console.log(`  🎤  ${line.id}: "${line.text.slice(0, 50)}${line.text.length > 50 ? '...' : ''}"`);

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_IDS.narrator}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': API_KEY!,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text: line.text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: VOICE_SETTINGS,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`  ❌  ${line.id} — ${response.status}: ${errorText.slice(0, 200)}`);
      return false;
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    writeFileSync(outPath, audioBuffer);
    console.log(`  ✓  ${line.id} — ${(audioBuffer.length / 1024).toFixed(1)} KB`);
    return true;
  } catch (err) {
    console.error(`  ❌  ${line.id} — ${(err as Error).message}`);
    return false;
  }
}

async function main() {
  const target = process.argv[2] || 'all';
  const scriptsToRun = target === 'all'
    ? Object.keys(SCRIPTS)
    : [target];

  for (const name of scriptsToRun) {
    const script = SCRIPTS[name];
    if (!script) {
      console.warn(`Unknown script: ${name}. Available: ${Object.keys(SCRIPTS).join(', ')}`);
      continue;
    }
    console.log(`\n🎬 Generating ${name} (${script.length} lines)`);
    let ok = 0;
    for (const line of script) {
      if (await generateLine(line, name)) ok++;
      // Rate limit: wait 200ms between calls
      await new Promise((r) => setTimeout(r, 200));
    }
    console.log(`✓ ${name}: ${ok}/${script.length} lines generated`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
