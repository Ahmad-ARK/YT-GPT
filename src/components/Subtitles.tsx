import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { Scene, StyleGuide } from '../types/schema';

interface SubtitlesProps {
  styleGuide: StyleGuide;
  scenes: Scene[];
  fps: number;
}

// Configurable long-form caption settings
const captionBaseColor = "#FFFFFF"; // Clean white for base text
const captionHighlightColor = "#FFDE59"; // Classic subtitle yellow for active word
const wordsPerChunk = 6; // How many words appear at once

interface WordTiming {
  word: string;
  startMs: number;
  endMs: number;
}

interface Chunk {
  words: WordTiming[];
  startMs: number;
  endMs: number;
  text: string;
}

export const Subtitles: React.FC<SubtitlesProps> = ({ styleGuide, scenes, fps }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Pre-process all scenes into chunks so we can find them quickly
  const sceneChunks = useMemo(() => {
    const chunksByScene: Record<string, Chunk[]> = {};
    for (const scene of scenes) {
      const timings = scene.wordTimings || [];
      const chunks: Chunk[] = [];
      let currentWords: WordTiming[] = [];
      
      for (let i = 0; i < timings.length; i++) {
        currentWords.push(timings[i]);
        
        // Break chunk if we hit the limit, or if there's a huge pause (>1000ms), or at end
        const isLast = i === timings.length - 1;
        const nextPause = !isLast ? (timings[i+1].startMs - timings[i].endMs) : 0;
        
        if (currentWords.length >= wordsPerChunk || nextPause > 1000 || isLast) {
          chunks.push({
            words: currentWords,
            startMs: currentWords[0].startMs,
            endMs: currentWords[currentWords.length - 1].endMs + 500, // pad end
            text: currentWords.map(w => w.word).join(" ")
          });
          currentWords = [];
        }
      }
      chunksByScene[scene.id] = chunks;
    }
    return chunksByScene;
  }, [scenes]);

  // Find the currently active scene and chunk
  let activeChunk: Chunk | null = null;
  let activeWordIndex = -1;
  let accumulatedFrames = 0;

  for (const scene of scenes) {
    const totalDurationMs = scene.durationMs || 5000;
    const sceneDurationFrames = Math.max(1, Math.floor(totalDurationMs / 1000 * fps));
    const sceneStartFrame = accumulatedFrames;
    const sceneEndFrame = accumulatedFrames + sceneDurationFrames;

    if (frame >= sceneStartFrame && frame < sceneEndFrame) {
      const frameInScene = frame - sceneStartFrame;
      const timeInSceneMs = (frameInScene / fps) * 1000;
      const chunks = sceneChunks[scene.id] || [];

      // Find the active chunk
      const chunk = [...chunks].reverse().find(c => timeInSceneMs >= c.startMs);
      
      if (chunk && timeInSceneMs <= chunk.endMs) {
        activeChunk = chunk;
        // Find which word in the chunk is currently active
        // Reverse find to hold highlight on the last spoken word during short pauses inside the chunk
        const wIndex = [...chunk.words].reverse().findIndex(w => timeInSceneMs >= w.startMs);
        if (wIndex !== -1) {
          // Because we reversed the array to find it, we must subtract from length to get true index
          activeWordIndex = (chunk.words.length - 1) - wIndex;
        }
      }
      break;
    }
    accumulatedFrames = sceneEndFrame;
  }

  if (!activeChunk) {
    return null;
  }

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: styleGuide.layout.safeMarginPx + 60, // slightly higher for long form
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          fontFamily: styleGuide.typography.fontFamilies.display,
          fontSize: styleGuide.typography.scale.h3 * 0.9, // Slightly smaller than single-word
          fontWeight: 800,
          textAlign: 'center',
          maxWidth: '85%',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '12px',
          padding: '20px 40px',
          textShadow: `0px 4px 16px rgba(0,0,0,0.9), 0px 0px 8px rgba(0,0,0,0.8)`,
        }}
      >
        {activeChunk.words.map((w, i) => {
          const isActive = i === activeWordIndex;
          const isPassed = i < activeWordIndex;
          
          return (
            <span
              key={`${w.word}-${i}`}
              style={{
                color: isActive ? captionHighlightColor : captionBaseColor,
                opacity: isPassed ? 0.9 : (isActive ? 1 : 0.7),
                transform: isActive ? 'scale(1.1)' : 'scale(1)',
                transition: 'all 0.1s ease-out',
                display: 'inline-block',
                textTransform: 'uppercase',
              }}
            >
              {w.word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
