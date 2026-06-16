import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { Scene, StyleGuide } from '../types/schema';
import { getTriggerFrame } from '../utils/timing';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface InfographicItem {
  icon: string;
  value: string;
  label: string;
  triggerWord?: string;
}

interface InfographicDirective {
  title?: string;
  items: InfographicItem[];
}

interface InfographicSceneProps {
  styleGuide: StyleGuide;
  scene: Scene;
  durationMs: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Extract the leading numeric portion of a value string like "50M", "$4T", "70%".
 * Returns { prefix, num, suffix } so we can animate just the number.
 */
function parseValue(raw: string): { prefix: string; num: number; suffix: string } {
  const match = raw.match(/^([^0-9]*?)([\d,.]+)(.*)$/);
  if (!match) return { prefix: '', num: 0, suffix: raw };
  return {
    prefix: match[1],
    num: parseFloat(match[2].replace(/,/g, '')),
    suffix: match[3],
  };
}

/** Format a number back with commas for thousands separators. */
function formatNum(n: number, decimals: number): string {
  const fixed = n.toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decPart && decimals > 0 ? `${withCommas}.${decPart}` : withCommas;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

const StatCard: React.FC<{
  item: InfographicItem;
  index: number;
  triggerFrame: number;
  frame: number;
  fps: number;
  totalFrames: number;
  styleGuide: StyleGuide;
}> = ({ item, index, triggerFrame, frame, fps, totalFrames, styleGuide }) => {
  const { prefix, num, suffix } = parseValue(item.value);
  const hasDecimals = item.value.includes('.');
  const decimals = hasDecimals ? (item.value.split('.')[1]?.replace(/[^0-9]/g, '').length ?? 0) : 0;

  /* --- entrance spring --- */
  const enterProgress = spring({
    frame: Math.max(0, frame - triggerFrame),
    fps,
    config: { damping: 14, stiffness: 120, mass: 0.8 },
  });

  const scale = interpolate(enterProgress, [0, 1], [0.5, 1]);
  const opacity = interpolate(enterProgress, [0, 1], [0, 1]);
  const translateY = interpolate(enterProgress, [0, 1], [40, 0]);

  /* --- number count-up --- */
  const countDurationFrames = Math.min(fps * 1.2, totalFrames - triggerFrame);
  const countProgress = interpolate(
    frame,
    [triggerFrame, triggerFrame + countDurationFrames],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const displayNum = num * countProgress;

  /* --- subtle glow pulse after entrance --- */
  const glowPhase = Math.max(0, frame - triggerFrame - fps * 0.6);
  const glowOpacity = interpolate(
    Math.sin(glowPhase * 0.06),
    [-1, 1],
    [0.0, 0.12],
  );

  const colors = styleGuide.color;
  const fonts = styleGuide.typography.fontFamilies;

  return (
    <div
      style={{
        transform: `scale(${scale}) translateY(${translateY}px)`,
        opacity,
        background: `linear-gradient(135deg, ${colors.surface}CC, ${colors.surface}99)`,
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderRadius: 20,
        border: `1px solid ${colors.primary}33`,
        padding: '36px 24px 30px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: `0 8px 32px ${colors.primary}18, inset 0 1px 0 ${colors.text}08`,
      }}
    >
      {/* glow ring behind icon */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.accent}${Math.round(glowOpacity * 255).toString(16).padStart(2, '0')}, transparent 70%)`,
          filter: 'blur(12px)',
          pointerEvents: 'none',
        }}
      />

      {/* icon */}
      <span style={{ fontSize: 48, lineHeight: 1, zIndex: 1 }}>
        {item.icon}
      </span>

      {/* number */}
      <span
        style={{
          fontFamily: fonts.display,
          fontSize: 52,
          fontWeight: 800,
          color: colors.primary,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          zIndex: 1,
        }}
      >
        {prefix}
        {formatNum(displayNum, decimals)}
        {suffix}
      </span>

      {/* label */}
      <span
        style={{
          fontFamily: fonts.body,
          fontSize: 18,
          fontWeight: 500,
          color: `${colors.text}BB`,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          zIndex: 1,
        }}
      >
        {item.label}
      </span>

      {/* decorative corner accent */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: 60,
          height: 60,
          background: `linear-gradient(135deg, transparent 50%, ${colors.accent}15 50%)`,
          borderRadius: '0 0 20px 0',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export const InfographicScene: React.FC<InfographicSceneProps> = ({
  styleGuide,
  scene,
  durationMs,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const totalFrames = Math.max(1, Math.floor((durationMs / 1000) * fps));

  /* --- parse directive --- */
  let directive: InfographicDirective = { items: [] };
  try {
    directive = JSON.parse(scene.visual.directive) as InfographicDirective;
  } catch {
    // graceful fallback – render empty
  }

  const { title, items } = directive;
  const narration = scene.narration ?? '';
  const onScreenText = scene.onScreenText ?? '';

  /* --- grid layout columns based on item count --- */
  const cols = items.length <= 3 ? items.length : items.length <= 4 ? 2 : 3;

  const colors = styleGuide.color;
  const fonts = styleGuide.typography.fontFamilies;

  /* --- title entrance --- */
  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 100, mass: 0.7 },
  });
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);
  const titleY = interpolate(titleSpring, [0, 1], [-30, 0]);

  /* --- on-screen text fade in --- */
  const textFadeIn = interpolate(frame, [fps * 0.5, fps * 1.2], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        fontFamily: fonts.body,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 80px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ---- background grid pattern ---- */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(${colors.text}08 1px, transparent 1px),
            linear-gradient(90deg, ${colors.text}08 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          pointerEvents: 'none',
        }}
      />

      {/* radial glow */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 800,
          height: 800,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.primary}12, transparent 65%)`,
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      {/* ---- title ---- */}
      {title && (
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            marginBottom: 48,
            textAlign: 'center',
            zIndex: 1,
          }}
        >
          <h1
            style={{
              fontFamily: fonts.display,
              fontSize: 56,
              fontWeight: 800,
              color: colors.text,
              margin: 0,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </h1>
          {/* decorative underline */}
          <div
            style={{
              margin: '16px auto 0',
              width: interpolate(titleSpring, [0, 1], [0, 120]),
              height: 3,
              borderRadius: 2,
              background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})`,
            }}
          />
        </div>
      )}

      {/* ---- stat cards grid ---- */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 28,
          width: '100%',
          maxWidth: 1100,
          zIndex: 1,
        }}
      >
        {items.map((item, i) => {
          const fallback = Math.floor((totalFrames / (items.length + 1)) * (i + 1));
          const trigger = getTriggerFrame(scene, item.triggerWord, totalFrames, fallback);

          return (
            <StatCard
              key={i}
              item={item}
              index={i}
              triggerFrame={trigger}
              frame={frame}
              fps={fps}
              totalFrames={totalFrames}
              styleGuide={styleGuide}
            />
          );
        })}
      </div>

      {/* ---- on-screen text ---- */}
      {onScreenText && (
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            left: 80,
            right: 80,
            textAlign: 'center',
            opacity: textFadeIn,
            zIndex: 1,
          }}
        >
          <span
            style={{
              fontFamily: fonts.body,
              fontSize: 22,
              fontWeight: 500,
              color: `${colors.text}CC`,
              background: `${colors.surface}AA`,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              padding: '10px 28px',
              borderRadius: 12,
              border: `1px solid ${colors.text}15`,
            }}
          >
            {onScreenText}
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};
