import React, { useMemo } from 'react';
import { Composition, Series } from 'remotion';
import { MapScene } from './components/MapScene';
import { TitleCard } from './components/TitleCard';
import { StatScene } from './components/StatScene';
import { TimelineScene } from './components/TimelineScene';
import { QuoteCard } from './components/QuoteCard';
import { ChartScene } from './components/ChartScene';
import { ArchiveMontageScene } from './components/ArchiveMontageScene';
import storyboard from '../public/storyboard.json';
import { channelAStyleGuide } from './style/channelA';
import { Scene as SceneType } from './types/schema';

// Helper component to route to the correct visual type
const SceneRenderer: React.FC<{ scene: SceneType; fps: number }> = ({ scene, fps }) => {
  const durationMs = scene.durationMs || 5000;
  
  switch (scene.visual.type) {
    case 'titleCard':
      return <TitleCard styleGuide={channelAStyleGuide} scene={scene} durationMs={durationMs} />;
    case 'map':
      return <MapScene styleGuide={channelAStyleGuide} scene={scene} durationMs={durationMs} />;
    case 'stat':
      return <StatScene styleGuide={channelAStyleGuide} scene={scene} durationMs={durationMs} />;
    case 'timeline':
      return <TimelineScene styleGuide={channelAStyleGuide} scene={scene} durationMs={durationMs} />;
    case 'quoteCard':
      return <QuoteCard styleGuide={channelAStyleGuide} scene={scene} durationMs={durationMs} />;
    case 'chart':
      return <ChartScene styleGuide={channelAStyleGuide} scene={scene} durationMs={durationMs} />;
    case 'archiveMontage':
      return <ArchiveMontageScene styleGuide={channelAStyleGuide} scene={scene} durationMs={durationMs} />;
    default:
      return (
        <div style={{ flex: 1, backgroundColor: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
          Missing visual type: {scene.visual.type}
        </div>
      );
  }
};

export const DocumentarySequence: React.FC = () => {
  const fps = 30;
  
  return (
    <Series>
      {storyboard.scenes.map((scene: any) => {
        const durationFrames = Math.max(1, Math.floor((scene.durationMs || 5000) / 1000 * fps));
        return (
          <Series.Sequence key={scene.id} durationInFrames={durationFrames}>
            <SceneRenderer scene={scene as SceneType} fps={fps} />
          </Series.Sequence>
        );
      })}
    </Series>
  );
};

// Wrapper to inject props to SceneRenderer correctly
const SingleSceneComponent: React.FC<{ scene: SceneType; fps: number }> = ({ scene, fps }) => {
  return <SceneRenderer scene={scene} fps={fps} />;
};

export const RemotionRoot: React.FC = () => {
  const fps = 30;
  
  // Calculate total duration for the full documentary
  const totalDurationMs = storyboard.scenes.reduce((acc, scene) => acc + (scene.durationMs || 5000), 0);
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
      
      {/* Expose individual scenes for fast iteration/testing in the studio */}
      {storyboard.scenes.map((scene: any) => {
        const durationFrames = Math.max(1, Math.floor((scene.durationMs || 5000) / 1000 * fps));
        return (
          <Composition
            key={scene.id}
            id={`Scene-${scene.visual.type}-${scene.id}`}
            component={SingleSceneComponent}
            defaultProps={{ scene: scene as SceneType, fps }}
            durationInFrames={durationFrames}
            fps={fps}
            width={1920}
            height={1080}
          />
        );
      })}
    </>
  );
};
