import { execSync } from 'child_process';
import path from 'path';
import { TTSProvider, TTSResult, WordTiming } from './provider';
import { getAudioDurationInSeconds } from 'get-audio-duration';

export class EdgeTTSProvider implements TTSProvider {
  async synthesize(text: string, outPath: string): Promise<TTSResult> {
    const wrapperScript = path.join(__dirname, 'edge_wrapper.py');
    
    // Call the Python wrapper
    const output = execSync(`python "${wrapperScript}" "${text}" "${outPath}"`).toString();
    
    const wordTimings: WordTiming[] = JSON.parse(output.trim());
    
    // Measure actual duration
    const durationSec = await getAudioDurationInSeconds(outPath);
    const durationMs = Math.round(durationSec * 1000);
    
    return {
      audioPath: outPath,
      durationMs,
      wordTimings
    };
  }
}
