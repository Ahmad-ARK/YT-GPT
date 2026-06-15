import * as fs from 'fs';
import * as path from 'path';
import * as googleTTS from 'google-tts-api';
import { getAudioDurationInSeconds } from 'get-audio-duration';

const STORYBOARD_PATH = path.join(process.cwd(), 'public', 'storyboard.json');
const AUDIO_DIR = path.join(process.cwd(), 'public', 'audio');

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function downloadTTS(text: string, filepath: string, retries = MAX_RETRIES): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const results = await googleTTS.getAllAudioBase64(text, {
        lang: 'en',
        slow: false,
        host: 'https://translate.google.com',
        splitPunct: ',.?',
      });

      const buffers = results.map((res) => Buffer.from(res.base64, 'base64'));
      const finalBuffer = Buffer.concat(buffers);
      fs.writeFileSync(filepath, finalBuffer);
      return; // Success
    } catch (err) {
      if (attempt < retries) {
        console.log(`      ⚠ Attempt ${attempt} failed, retrying in ${RETRY_DELAY_MS}ms...`);
        await sleep(RETRY_DELAY_MS);
      } else {
        throw err; // Final attempt failed
      }
    }
  }
}

async function run() {
  if (!fs.existsSync(STORYBOARD_PATH)) {
    console.error("No storyboard.json found. Run the generator first.");
    process.exit(1);
  }

  // Clean old audio files
  if (fs.existsSync(AUDIO_DIR)) {
    fs.rmSync(AUDIO_DIR, { recursive: true });
  }
  fs.mkdirSync(AUDIO_DIR, { recursive: true });

  const storyboard = JSON.parse(fs.readFileSync(STORYBOARD_PATH, 'utf-8'));
  console.log(`\n🎙️ Generating TTS Audio for: "${storyboard.topic}"...\n`);

  for (const scene of storyboard.scenes) {
    if (!scene.narration || typeof scene.narration !== 'string' || !scene.narration.trim()) {
      console.log(`   Skipping ${scene.id} (no narration)`);
      continue;
    }

    const audioFilename = `${scene.id}.mp3`;
    const audioFilepath = path.join(AUDIO_DIR, audioFilename);

    console.log(`   Downloading audio for ${scene.id}...`);
    try {
      await downloadTTS(scene.narration, audioFilepath);
      
      const durationSecs = await getAudioDurationInSeconds(audioFilepath);
      
      // Add 500ms pad for breathing room
      const paddedDurationMs = Math.round((durationSecs * 1000) + 500); 
      
      scene.durationMs = Math.max(3000, paddedDurationMs);
      scene.audioFilename = audioFilename;
      
      console.log(`   -> ${audioFilename} (${durationSecs.toFixed(2)}s) => scene duration: ${scene.durationMs}ms`);
      
      // Small delay between requests to avoid rate limiting
      await sleep(500);
    } catch (err: any) {
      console.error(`   ❌ Failed to generate audio for ${scene.id}: ${err.message}`);
      // Keep the original durationMs if TTS fails
    }
  }

  fs.writeFileSync(STORYBOARD_PATH, JSON.stringify(storyboard, null, 2));
  console.log(`\n✅ TTS Generation Complete! storyboard.json updated with audio durations.`);
}

run();
