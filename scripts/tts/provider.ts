export type WordTiming = { word: string; startMs: number; endMs: number };

export type TTSResult = { 
  audioPath: string; 
  durationMs: number; 
  wordTimings: WordTiming[] 
};

export interface TTSProvider {
  synthesize(text: string, outPath: string): Promise<TTSResult>;
}
