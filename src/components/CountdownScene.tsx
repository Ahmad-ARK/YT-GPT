import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { Scene, StyleGuide } from "../types/schema";

interface CountdownSceneProps {
  styleGuide: StyleGuide;
  scene: Scene;
  durationMs: number;
}

export const CountdownScene: React.FC<CountdownSceneProps> = ({
  styleGuide,
  scene,
  durationMs,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const totalFrames = Math.max(1, Math.floor((durationMs / 1000) * fps));

  // Parse directive
  const directive = JSON.parse(scene.visual.directive || "{}");
  const from: number = directive.from ?? 10;
  const to: number = directive.to ?? 0;
  const label: string = directive.label || "";
  const suffix: string = directive.suffix || "";

  const range = from - to; // e.g. 13
  const countSteps = Math.max(1, range);

  // Overall progress 0→1
  const progress = Math.min(1, frame / totalFrames);

  // Current countdown number
  const rawNumber = from - progress * range;
  const currentNumber = Math.max(to, Math.round(rawNumber));

  // Which "tick" are we on? (0-indexed from the start)
  const tickIndex = from - currentNumber; // 0 at start, range at end
  const framesPerTick = totalFrames / countSteps;
  const frameInTick = frame - tickIndex * framesPerTick;

  // Pulse spring on each tick change
  const pulseSpring = spring({
    frame: Math.max(0, Math.floor(frameInTick)),
    fps,
    config: { damping: 8, stiffness: 200, mass: 0.6 },
  });

  // Scale: idle 1.0, on tick pulse up to 1.25 then settle back
  const pulseScale = interpolate(pulseSpring, [0, 0.5, 1], [1.3, 1.05, 1]);

  // Ring progress (1 = full circle, 0 = depleted)
  const ringProgress = 1 - progress;

  // Intensity ramp as we approach zero (0→1)
  const urgency = progress;

  // Glow intensity — pulses on each tick, stronger near zero
  const baseGlow = interpolate(urgency, [0, 0.5, 1], [0.3, 0.5, 1]);
  const glowPulse = interpolate(pulseSpring, [0, 0.4, 1], [1.4, 1.0, 1.0]);
  const glowIntensity = baseGlow * glowPulse;

  // Colors — shift from accent toward red as urgency increases
  const numberColor = interpolate(urgency, [0, 0.7, 1], [0, 0, 0]).toString();
  // We'll compute a hex-blended color between primary and a hot red
  const hotRed = "#FF2020";
  const numberColorBlend = lerpColor(
    styleGuide.color.primary,
    hotRed,
    Math.min(1, urgency * 1.3)
  );

  const glowColor = lerpColor(
    styleGuide.color.accent,
    hotRed,
    Math.min(1, urgency * 1.2)
  );

  // Fade in/out
  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [totalFrames - 20, totalFrames], [1, 0], {
    extrapolateLeft: "clamp",
  });
  const opacity = fadeIn * fadeOut;

  // SVG ring dimensions
  const ringRadius = 200;
  const ringStroke = 8;
  const ringCenter = ringRadius + ringStroke;
  const ringSize = ringCenter * 2;
  const circumference = 2 * Math.PI * ringRadius;

  // Label entrance
  const labelSpring = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { damping: 14, stiffness: 80 },
  });
  const labelOpacity = interpolate(labelSpring, [0, 1], [0, 1]);
  const labelY = interpolate(labelSpring, [0, 1], [-20, 0]);

  // Suffix entrance
  const suffixSpring = spring({
    frame: Math.max(0, frame - 25),
    fps,
    config: { damping: 14, stiffness: 80 },
  });
  const suffixOpacity = interpolate(suffixSpring, [0, 1], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: styleGuide.color.bg,
        justifyContent: "center",
        alignItems: "center",
        opacity,
      }}
    >
      {/* Background radial glow */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          background: `radial-gradient(circle at 50% 50%, ${hexToRgba(glowColor, 0.15 * glowIntensity)} 0%, ${hexToRgba(glowColor, 0.05 * glowIntensity)} 30%, transparent 60%)`,
        }}
      />

      {/* Secondary pulsing glow layer */}
      <div
        style={{
          position: "absolute",
          width: `${500 * glowIntensity}px`,
          height: `${500 * glowIntensity}px`,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${hexToRgba(glowColor, 0.3 * glowIntensity)} 0%, transparent 70%)`,
          transform: `scale(${pulseScale})`,
          filter: `blur(${40 + urgency * 30}px)`,
        }}
      />

      {/* Outer decorative ring (faint) */}
      <svg
        width={ringSize + 40}
        height={ringSize + 40}
        style={{ position: "absolute" }}
      >
        <circle
          cx={ringCenter + 20}
          cy={ringCenter + 20}
          r={ringRadius + 16}
          fill="none"
          stroke={hexToRgba(styleGuide.color.primary, 0.08)}
          strokeWidth={1}
        />
      </svg>

      {/* Progress ring SVG */}
      <svg
        width={ringSize}
        height={ringSize}
        style={{
          position: "absolute",
          transform: "rotate(-90deg)",
          filter: `drop-shadow(0 0 ${12 + urgency * 20}px ${hexToRgba(glowColor, 0.5 * glowIntensity)})`,
        }}
      >
        {/* Background track */}
        <circle
          cx={ringCenter}
          cy={ringCenter}
          r={ringRadius}
          fill="none"
          stroke={hexToRgba(styleGuide.color.primary, 0.12)}
          strokeWidth={ringStroke}
        />

        {/* Active ring */}
        <circle
          cx={ringCenter}
          cy={ringCenter}
          r={ringRadius}
          fill="none"
          stroke={numberColorBlend}
          strokeWidth={ringStroke + urgency * 4}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ringProgress)}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 0.1s ease-out",
          }}
        />
      </svg>

      {/* Central content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 1,
          transform: `scale(${pulseScale})`,
        }}
      >
        {/* Label above */}
        {label && (
          <div
            style={{
              fontFamily: styleGuide.typography.fontFamilies.body,
              fontSize: `${styleGuide.typography.scale.caption || 18}px`,
              fontWeight: 600,
              letterSpacing: "4px",
              color: styleGuide.color.textMuted,
              textTransform: "uppercase" as const,
              marginBottom: "16px",
              opacity: labelOpacity,
              transform: `translateY(${labelY}px)`,
            }}
          >
            {label}
          </div>
        )}

        {/* Countdown number */}
        <div
          style={{
            fontFamily: styleGuide.typography.fontFamilies.display,
            fontSize: "180px",
            fontWeight: 800,
            lineHeight: 1,
            color: numberColorBlend,
            textShadow: [
              `0 0 ${20 + glowIntensity * 40}px ${hexToRgba(glowColor, 0.6 * glowIntensity)}`,
              `0 0 ${60 + glowIntensity * 80}px ${hexToRgba(glowColor, 0.3 * glowIntensity)}`,
              `0 4px 20px rgba(0,0,0,0.5)`,
            ].join(", "),
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {currentNumber}
        </div>

        {/* Suffix below number */}
        {suffix && (
          <div
            style={{
              fontFamily: styleGuide.typography.fontFamilies.body,
              fontSize: `${styleGuide.typography.scale.h3 || 28}px`,
              fontWeight: 500,
              color: hexToRgba(numberColorBlend, 0.7),
              letterSpacing: "3px",
              textTransform: "uppercase" as const,
              marginTop: "8px",
              opacity: suffixOpacity,
              textShadow: `0 0 20px ${hexToRgba(glowColor, 0.3)}`,
            }}
          >
            {suffix}
          </div>
        )}
      </div>

      {/* Tick marks around the ring */}
      <svg
        width={ringSize + 60}
        height={ringSize + 60}
        style={{ position: "absolute", opacity: 0.3 }}
      >
        {Array.from({ length: countSteps + 1 }).map((_, i) => {
          const angle = (i / countSteps) * 360 - 90;
          const rad = (angle * Math.PI) / 180;
          const outer = ringRadius + 28;
          const inner = ringRadius + 20;
          const cx = ringCenter + 30;
          const cy = ringCenter + 30;
          const isPast = i <= tickIndex;
          return (
            <line
              key={i}
              x1={cx + inner * Math.cos(rad)}
              y1={cy + inner * Math.sin(rad)}
              x2={cx + outer * Math.cos(rad)}
              y2={cy + outer * Math.sin(rad)}
              stroke={isPast ? numberColorBlend : styleGuide.color.textMuted}
              strokeWidth={isPast ? 2.5 : 1}
              opacity={isPast ? 0.8 : 0.3}
            />
          );
        })}
      </svg>

      {/* On-screen text at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: styleGuide.layout.safeMarginPx,
          left: styleGuide.layout.safeMarginPx,
          right: styleGuide.layout.safeMarginPx,
          fontFamily: styleGuide.typography.fontFamilies.body,
          fontSize: `${styleGuide.typography.scale.body || 20}px`,
          color: styleGuide.color.text,
          textAlign: "center" as const,
          textShadow: "0 4px 10px rgba(0,0,0,0.8)",
        }}
      >
        {scene.onScreenText || ""}
      </div>
    </AbsoluteFill>
  );
};

// ── Helpers ──────────────────────────────────────────────────────

/** Parse a hex color to [r, g, b] */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  return [
    parseInt(full.substring(0, 2), 16),
    parseInt(full.substring(2, 4), 16),
    parseInt(full.substring(4, 6), 16),
  ];
}

/** Convert hex + alpha to rgba string */
function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, alpha))})`;
}

/** Linearly interpolate between two hex colors */
function lerpColor(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(ar + (br - ar) * t);
  const g = clamp(ag + (bg - ag) * t);
  const bl = clamp(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}
