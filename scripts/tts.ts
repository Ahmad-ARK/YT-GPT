import * as fs from 'fs';
import * as path from 'path';
import { EdgeTTSProvider } from './tts/edge';

const STORYBOARD_PATH = path.join(process.cwd(), 'public', 'storyboard.json');
const AUDIO_DIR = path.join(process.cwd(), 'public', 'audio');

async function run() {
  if (!fs.existsSync(STORYBOARD_PATH)) {
    console.error("No storyboard.json found. Run the generator first.");
    process.exit(1);
  }

  // NOTE: We no longer clean the entire AUDIO_DIR because bgMusic or sfx might be there.
  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }

  const storyboard = JSON.parse(fs.readFileSync(STORYBOARD_PATH, 'utf-8'));
  console.log(`\n🎙️ Generating TTS Audio for: "${storyboard.topic}"...\n`);

  const ttsProvider = new EdgeTTSProvider();

  for (const scene of storyboard.scenes) {
    if (!scene.narration || typeof scene.narration !== 'string' || !scene.narration.trim()) {
      console.log(`   Skipping ${scene.id} (no narration)`);
      continue;
    }

    const audioFilename = `${scene.id}.mp3`;
    const audioFilepath = path.join(AUDIO_DIR, audioFilename);

    console.log(`   Generating audio and timings for ${scene.id}...`);
    try {
      const result = await ttsProvider.synthesize(scene.narration, audioFilepath);
      
      // Add 500ms pad for breathing room
      scene.durationMs = Math.max(3000, result.durationMs + 500);
      scene.audioFilename = audioFilename;
      scene.wordTimings = result.wordTimings;
      
      console.log(`   -> ${audioFilename} (${result.durationMs}ms) => padded scene duration: ${scene.durationMs}ms`);
      
    } catch (err: any) {
      console.error(`   ❌ Failed to generate audio for ${scene.id}: ${err.message}`);
      // Keep the original durationMs if TTS fails
    }
  }

  fs.writeFileSync(STORYBOARD_PATH, JSON.stringify(storyboard, null, 2));
  console.log(`\n✅ TTS Generation Complete! storyboard.json updated with audio durations and word timings.`);
}

run();
