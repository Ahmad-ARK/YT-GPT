import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { Scene, StyleGuide } from '../types/schema';
import { getTriggerFrame } from '../utils/timing';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RankingItem {
  rank: number;
  label: string;
  value?: string;
  triggerWord?: string;
}

interface RankingDirective {
  title?: string;
  items: RankingItem[];
}

interface RankingSceneProps {
  styleGuide: StyleGuide;
  scene: Scene;
  durationMs: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const MEDAL_COLORS: Record<number, string> = {
  1: '#FFD700', // gold
  2: '#C0C0C0', // silver
  3: '#CD7F32', // bronze
};

const FADE_FRAMES = 20;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const RankingScene: React.FC<RankingSceneProps> = ({
  styleGuide,
  scene,
  durationMs,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const totalFrames = Math.max(1, Math.floor((durationMs / 1000) * fps));

  /* ---- parse directive ---- */
  let directive: RankingDirective = { items: [] };
  try {
    directive = JSON.parse(scene.visual?.directive ?? '{}');
  } catch {
    /* graceful fallback */
  }
  const { title, items } = directive;

  /* ---- narration text for trigger matching ---- */
  const narration = scene.narration ?? '';

  /* ---- global fade in / out ---- */
  const opacity = interpolate(
    frame,
    [0, FADE_FRAMES, totalFrames - FADE_FRAMES, totalFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  /* ---- style tokens ---- */
  const bg = styleGuide.color?.bg ?? '#0a0a0f';
  const surface = styleGuide.color?.surface ?? '#141420';
  const textColor = styleGuide.color?.text ?? '#ffffff';
  const primary = styleGuide.color?.primary ?? '#6c8cff';
  const displayFont = styleGuide.typography?.fontFamilies?.display ?? 'Inter, sans-serif';

  /* ---- title spring ---- */
  const titleProgress = spring({ frame, fps, config: { damping: 18, stiffness: 80 } });
  const titleY = interpolate(titleProgress, [0, 1], [-40, 0]);
  const titleOpacity = titleProgress;

  /* ---- bottom text ---- */
  const onScreenText = (scene as any).onScreenText ?? '';

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bg,
        fontFamily: displayFont,
        color: textColor,
        opacity,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 80px',
        overflow: 'hidden',
      }}
    >
      {/* ---- Decorative background gradient ---- */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `radial-gradient(ellipse at 50% 0%, ${primary}18 0%, transparent 60%)`,
          pointerEvents: 'none',
        }}
      />

      {/* ---- Title ---- */}
      {title && (
        <div
          style={{
            fontSize: 48,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: 3,
            marginBottom: 40,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            background: `linear-gradient(135deg, ${primary}, ${textColor})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textAlign: 'center',
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>
      )}

      {/* ---- Items list ---- */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          width: '100%',
          maxWidth: 1000,
        }}
      >
        {items.map((item, idx) => {
          /* trigger frame for this item */
          const fallback = Math.floor(
            totalFrames * ((idx + 1) / (items.length + 1)),
          );
          const triggerFrame = getTriggerFrame(scene,
            item.triggerWord,
            totalFrames,
            fallback,
          );

          /* spring starts at triggerFrame */
          const localFrame = Math.max(0, frame - triggerFrame);
          const prog = spring({
            frame: localFrame,
            fps,
            config: { damping: 14, stiffness: 60, mass: 0.8 },
          });

          const slideX = interpolate(prog, [0, 1], [600, 0]);
          const itemOpacity = prog;

          /* glow: item is "active" shortly after its trigger */
          const glowAlpha = interpolate(
            frame,
            [triggerFrame, triggerFrame + 15, triggerFrame + 40],
            [0, 0.45, 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
          );

          const accentColor = MEDAL_COLORS[item.rank] ?? primary;

          return (
            <div
              key={item.rank}
              style={{
                display: 'flex',
                alignItems: 'center',
                position: 'relative',
                opacity: itemOpacity,
                transform: `translateX(${slideX}px)`,
                height: 72,
              }}
            >
              {/* ---- Background bar ---- */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 10,
                  background: `linear-gradient(90deg, ${surface}cc, ${surface}88)`,
                  border: `1px solid ${accentColor}33`,
                  boxShadow: glowAlpha > 0
                    ? `0 0 24px ${accentColor}${Math.round(glowAlpha * 255).toString(16).padStart(2, '0')}, inset 0 0 40px ${accentColor}${Math.round(glowAlpha * 100).toString(16).padStart(2, '0')}`
                    : 'none',
                }}
              />

              {/* ---- Accent side stripe ---- */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '15%',
                  bottom: '15%',
                  width: 4,
                  borderRadius: 4,
                  background: accentColor,
                  boxShadow: `0 0 10px ${accentColor}88`,
                }}
              />

              {/* ---- Rank number ---- */}
              <div
                style={{
                  width: 90,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 64,
                  fontWeight: 900,
                  lineHeight: 1,
                  position: 'relative',
                  zIndex: 1,
                  background: `linear-gradient(180deg, ${accentColor}, ${accentColor}99)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: `drop-shadow(0 0 6px ${accentColor}66)`,
                }}
              >
                {item.rank}
              </div>

              {/* ---- Label ---- */}
              <div
                style={{
                  flex: 1,
                  fontSize: 28,
                  fontWeight: 600,
                  position: 'relative',
                  zIndex: 1,
                  paddingLeft: 8,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {item.label}
              </div>

              {/* ---- Value / stat ---- */}
              {item.value && (
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: accentColor,
                    position: 'relative',
                    zIndex: 1,
                    paddingRight: 20,
                    whiteSpace: 'nowrap',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {item.value}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ---- On-screen text (bottom) ---- */}
      {onScreenText ? (
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: 20,
            fontWeight: 500,
            color: `${textColor}aa`,
            letterSpacing: 1,
            opacity: interpolate(
              frame,
              [10, 30, totalFrames - 30, totalFrames - 10],
              [0, 1, 1, 0],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
            ),
          }}
        >
          {onScreenText}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
