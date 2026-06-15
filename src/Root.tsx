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
  
  return (
    <>
      {/* Global Background Music */}
      {bgMusic && <Audio src={staticFile(`audio/${bgMusic}`)} loop volume={0.08} />}
      
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
                {visuals.map((visual: any, vIndex: number) => {
                  const weight = visual.weight || 1;
                  const visualDurationMs = Math.round((weight / totalWeight) * totalDurationMs);
                  const visualDurationFrames = Math.max(1, Math.floor(visualDurationMs / 1000 * fps));
                  
                  return (
                    <Series.Sequence key={`${scene.id}-v${vIndex}`} durationInFrames={visualDurationFrames}>
                      <VisualRenderer visual={visual} scene={scene as SceneType} durationMs={visualDurationMs} />
                    </Series.Sequence>
                  );
                })}
              </Series>
            </Series.Sequence>
          );
        })}
      </Series>
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
