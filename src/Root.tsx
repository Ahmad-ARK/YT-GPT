import React from 'react';
import { Composition, Series, Audio, staticFile } from 'remotion';
import { MapScene } from './components/MapScene';
import { TitleCard } from './components/TitleCard';
import { StatScene } from './components/StatScene';
import { TimelineScene } from './components/TimelineScene';
import { QuoteCard } from './components/QuoteCard';
import { ChartScene } from './components/ChartScene';
import { ArchiveMontageScene } from './components/ArchiveMontageScene';
import { NewspaperScene } from './components/NewspaperScene';
import { ComparisonScene } from './components/ComparisonScene';
import { GlobeScene } from './components/GlobeScene';
import { DocumentScene } from './components/DocumentScene';
import { CountdownScene } from './components/CountdownScene';
import { InfographicScene } from './components/InfographicScene';
import { RankingScene } from './components/RankingScene';
import { CinematicPhotoScene } from './components/CinematicPhotoScene';
import storyboard from '../public/storyboard.json';
import { channelAStyleGuide } from './style/channelA';
import { Scene as SceneType, VisualEntry } from './types/schema';
import { Subtitles } from './components/Subtitles';

// Helper: renders a single visual type
const VisualRenderer: React.FC<{ visual: VisualEntry; scene: SceneType; durationMs: number }> = ({ visual, scene, durationMs }) => {
  // Build a temporary scene object with this specific visual for the component
  const sceneForVisual = { ...scene, visual } as SceneType;

  switch (visual.type) {
    case 'titleCard':
      return <TitleCard styleGuide={channelAStyleGuide} scene={sceneForVisual} durationMs={durationMs} />;
    case 'map':
      return <MapScene styleGuide={channelAStyleGuide} scene={sceneForVisual} durationMs={durationMs} />;
    case 'globe':
      return <GlobeScene styleGuide={channelAStyleGuide} scene={sceneForVisual} durationMs={durationMs} />;
    case 'document':
      return <DocumentScene styleGuide={channelAStyleGuide} scene={sceneForVisual} durationMs={durationMs} />;
    case 'stat':
      return <StatScene styleGuide={channelAStyleGuide} scene={sceneForVisual} durationMs={durationMs} />;
    case 'timeline':
      return <TimelineScene styleGuide={channelAStyleGuide} scene={sceneForVisual} durationMs={durationMs} />;
    case 'quoteCard':
      return <QuoteCard styleGuide={channelAStyleGuide} scene={sceneForVisual} durationMs={durationMs} />;
    case 'chart':
      return <ChartScene styleGuide={channelAStyleGuide} scene={sceneForVisual} durationMs={durationMs} />;
    case 'archiveMontage':
      return <ArchiveMontageScene styleGuide={channelAStyleGuide} scene={sceneForVisual} durationMs={durationMs} />;
    case 'newspaper':
      return <NewspaperScene styleGuide={channelAStyleGuide} scene={sceneForVisual} durationMs={durationMs} />;
    case 'comparison':
      return <ComparisonScene styleGuide={channelAStyleGuide} scene={sceneForVisual} durationMs={durationMs} />;
    case 'countdown':
      return <CountdownScene styleGuide={channelAStyleGuide} scene={sceneForVisual} durationMs={durationMs} />;
    case 'infographic':
      return <InfographicScene styleGuide={channelAStyleGuide} scene={sceneForVisual} durationMs={durationMs} />;
    case 'ranking':
      return <RankingScene styleGuide={channelAStyleGuide} scene={sceneForVisual} durationMs={durationMs} />;
    case 'cinematicPhoto':
      return <CinematicPhotoScene styleGuide={channelAStyleGuide} scene={sceneForVisual} durationMs={durationMs} />;
    default:
      return (
        <div style={{ flex: 1, backgroundColor: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
          Missing visual type: {visual.type}
        </div>
      );
  }
};

// Resolves a scene's visuals: supports both legacy single `visual` and new `visuals` array
function resolveVisuals(scene: any): VisualEntry[] {
  if (scene.visuals && Array.isArray(scene.visuals) && scene.visuals.length > 0) {
    return scene.visuals;
  }
  // Backward compat: wrap single visual in array with weight 1
  return [{ ...scene.visual, weight: 1 }];
}

export const DocumentarySequence: React.FC = () => {
  const fps = 30;
  const bgMusic = storyboard.bgMusic; // e.g. "bg-music.mp3"
  
  // Precompute merged narration segments for smooth volume ducking
  const narrationSegments: {start: number, end: number}[] = [];
  let currFrame = 0;
  for (const scene of storyboard.scenes as any) {
    const sceneFrames = Math.max(1, Math.floor((scene.durationMs || 5000) / 1000 * fps));
    if (scene.audioFilename) {
      narrationSegments.push({ start: currFrame, end: currFrame + sceneFrames });
    }
    currFrame += sceneFrames;
  }

  const mergedSegments: {start: number, end: number}[] = [];
  if (narrationSegments.length > 0) {
    let curr = narrationSegments[0];
    for (let i = 1; i < narrationSegments.length; i++) {
      if (narrationSegments[i].start <= curr.end + 5) {
        curr.end = narrationSegments[i].end;
      } else {
        mergedSegments.push(curr);
        curr = narrationSegments[i];
      }
    }
    mergedSegments.push(curr);
  }

  const getDuckedVolume = (f: number) => {
    const fadeLen = 30; // 1 second fade out/in
    const duckVol = 0.03;
    const loudVol = 0.15;
    
    for (const seg of mergedSegments) {
      if (f >= seg.start && f <= seg.end) return duckVol; // Fully ducked during narration
      
      // Fading down before start
      if (f >= seg.start - fadeLen && f < seg.start) {
        const progress = (f - (seg.start - fadeLen)) / fadeLen;
        return loudVol - (loudVol - duckVol) * progress;
      }
      
      // Fading up after end
      if (f > seg.end && f <= seg.end + fadeLen) {
        const progress = (f - seg.end) / fadeLen;
        return duckVol + (loudVol - duckVol) * progress;
      }
    }
    
    return loudVol;
  };
  
  return (
    <>
      {/* Global Background Music with Ducking */}
      {bgMusic && <Audio src={staticFile(`audio/${bgMusic}`)} loop volume={getDuckedVolume} />}
      
      <Series>
        {storyboard.scenes.map((scene: any) => {
          const totalDurationMs = scene.durationMs || 5000;
          const totalDurationFrames = Math.max(1, Math.floor(totalDurationMs / 1000 * fps));
          const visuals = resolveVisuals(scene);
          
          const totalWeight = visuals.reduce((sum: number, v: any) => sum + (v.weight || 1), 0);
          
          return (
            <Series.Sequence key={scene.id} durationInFrames={totalDurationFrames}>
              {/* Voiceover Narration */}
              {scene.audioFilename && <Audio src={staticFile(`audio/${scene.audioFilename}`)} />}
              
              {/* Optional Scene Sound Effect */}
              {scene.sfx && <Audio src={staticFile(`audio/${scene.sfx}`)} volume={0.4} />}
              
              {/* Visual cuts */}
              <Series>
                {(() => {
                  let accumulatedFrames = 0;
                  return visuals.map((visual: any, vIndex: number) => {
                    const weight = visual.weight || 1;
                    const visualDurationMs = (weight / totalWeight) * totalDurationMs;
                    let visualDurationFrames = Math.round(visualDurationMs / 1000 * fps);
                    
                    // If this is the last visual, it takes all remaining frames
                    if (vIndex === visuals.length - 1) {
                      visualDurationFrames = totalDurationFrames - accumulatedFrames;
                    }
                    
                    // Failsafe minimum 1 frame
                    visualDurationFrames = Math.max(1, visualDurationFrames);
                    accumulatedFrames += visualDurationFrames;
                    
                    return (
                      <Series.Sequence key={`${scene.id}-v${vIndex}`} durationInFrames={visualDurationFrames}>
                        <VisualRenderer visual={visual} scene={scene as SceneType} durationMs={visualDurationFrames * 1000 / fps} />
                      </Series.Sequence>
                    );
                  });
                })()}
              </Series>
            </Series.Sequence>
          );
        })}
      </Series>
      
      {/* Global Word-Synced Subtitles */}
      <Subtitles styleGuide={channelAStyleGuide} scenes={storyboard.scenes as SceneType[]} fps={fps} />
    </>
  );
};

export const RemotionRoot: React.FC = () => {
  const fps = 30;
  
  // Calculate total duration for the full documentary
  const totalDurationMs = storyboard.scenes.reduce((acc: number, scene: any) => acc + (scene.durationMs || 5000), 0);
  const totalDurationFrames = Math.max(1, Math.floor(totalDurationMs / 1000 * fps));

  return (
    <>
      <Composition
        id="Documentary"
        component={DocumentarySequence}
        durationInFrames={totalDurationFrames}
        fps={fps}
        width={1920}
        height={1080}
      />
    </>
  );
};
