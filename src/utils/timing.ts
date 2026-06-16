/**
 * Calculates the exact frame a specific word is spoken within a narration string,
 * assuming a relatively constant speaking rate.
 * 
 * @param narration The full narration text for the scene
 * @param triggerWord The word to trigger the animation on
 * @param totalFrames Total frames in the scene
 * @returns The frame number where the word is spoken, or a fallback if not found
 */
export function getTriggerFrame(
  scene: any, 
  triggerWord: string | undefined, 
  totalFrames: number, 
  fallbackFrame: number,
  fps: number = 30
): number {
  const narration = scene.narration || "";
  if (!triggerWord || !narration) return fallbackFrame;

  const cleanTrigger = triggerWord.toLowerCase().replace(/[.,!?;:()]/g, '');

  // 1. Try real word timings
  if (scene.wordTimings && scene.wordTimings.length > 0) {
    const timing = scene.wordTimings.find((t: any) => {
      const cleanW = t.word.toLowerCase().replace(/[.,!?;:()]/g, '');
      return cleanW === cleanTrigger || cleanW.includes(cleanTrigger) || cleanTrigger.includes(cleanW);
    });
    if (timing) {
      return Math.floor((timing.startMs / 1000) * fps);
    }
  }

  // 2. Fallback estimation
  const cleanNarration = narration.toLowerCase().replace(/[.,!?;:()]/g, '');
  const words = cleanNarration.split(/\s+/);
  
  const wordIndex = words.findIndex(w => w === cleanTrigger || w.includes(cleanTrigger));

  if (wordIndex === -1) {
    console.warn(`Trigger word "${triggerWord}" not found in narration or timings. Using fallback.`);
    return fallbackFrame;
  }

  console.warn(`WordTimings missing for "${triggerWord}". Falling back to estimation.`);
  const percentage = wordIndex / Math.max(1, words.length);
  return Math.floor(percentage * totalFrames);
}
