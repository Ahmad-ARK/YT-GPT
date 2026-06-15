/**
 * Calculates the exact frame a specific word is spoken within a narration string,
 * assuming a relatively constant speaking rate.
 * 
 * @param narration The full narration text for the scene
 * @param triggerWord The word to trigger the animation on
 * @param totalFrames Total frames in the scene
 * @returns The frame number where the word is spoken, or a fallback if not found
 */
export function getTriggerFrame(narration: string, triggerWord: string | undefined, totalFrames: number, fallbackFrame: number): number {
  if (!triggerWord || !narration) return fallbackFrame;

  // Clean punctuation and convert to lowercase for matching
  const cleanNarration = narration.toLowerCase().replace(/[.,!?;:()]/g, '');
  const cleanTrigger = triggerWord.toLowerCase().replace(/[.,!?;:()]/g, '');

  const words = cleanNarration.split(/\s+/);
  
  // Find the word index (use the first occurrence)
  const wordIndex = words.findIndex(w => w === cleanTrigger || w.includes(cleanTrigger));

  if (wordIndex === -1) {
    console.warn(`Trigger word "${triggerWord}" not found in narration. Using fallback.`);
    return fallbackFrame;
  }

  // Calculate percentage through the sentence
  const percentage = wordIndex / Math.max(1, words.length);
  
  // Return the corresponding frame
  return Math.floor(percentage * totalFrames);
}
