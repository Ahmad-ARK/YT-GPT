import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { Scene, StyleGuide } from "../types/schema";

interface ChartSceneProps {
  styleGuide: StyleGuide;
  scene: Scene;
  durationMs: number;
}

export const ChartScene: React.FC<ChartSceneProps> = ({ styleGuide, scene, durationMs }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const directive = JSON.parse(scene.visual.directive || "{}");
  const data = directive.data || [
    { label: "1900", value: 20 },
    { label: "1950", value: 50 },
    { label: "2000", value: 90 },
    { label: "2020", value: 120 }
  ];
  const title = directive.title || "Global Growth";

  const totalFrames = Math.max(1, Math.floor((durationMs) / 1000 * fps));

  // Max value to scale the bars
  const maxValue = Math.max(...data.map((d: any) => d.value));

  // === PHASE 1: Bars grow in (first 30% of scene) ===
  const growPhaseEnd = Math.round(totalFrames * 0.3);
  const growStagger = data.length > 1 ? growPhaseEnd / data.length : growPhaseEnd;

  // === PHASE 2: Sequential spotlight (30% - 90% of scene) ===
  const spotlightStart = growPhaseEnd;
  const spotlightEnd = Math.round(totalFrames * 0.9);
  const spotlightWindow = spotlightEnd - spotlightStart;
  const spotlightSlot = data.length > 0 ? spotlightWindow / data.length : spotlightWindow;

  // Entrance/exit fade
  const fadeFrames = 20;
  const opacity = interpolate(
    frame,
    [0, fadeFrames, totalFrames - fadeFrames, totalFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: styleGuide.color.bg,
        justifyContent: "center",
        alignItems: "center",
        opacity: opacity,
      }}
    >
      <div
        style={{
          width: "1200px",
          height: "700px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            fontFamily: styleGuide.typography.fontFamilies.display,
            fontSize: `${styleGuide.typography.scale.h2}px`,
            color: styleGuide.color.text,
            marginBottom: "40px",
            textTransform: "uppercase",
            letterSpacing: "2px",
            borderBottom: `2px solid ${styleGuide.color.primary}`,
            paddingBottom: "10px",
          }}
        >
          {title}
        </div>

        <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: "40px" }}>
          {data.map((item: any, index: number) => {
            // Phase 1: Bar growth animation
            const barGrowStart = Math.round(index * growStagger);
            const barProgress = spring({
              frame: Math.max(0, frame - barGrowStart),
              fps,
              config: { damping: 12 },
            });

            const targetHeightPct = (item.value / maxValue) * 100;
            const currentHeightPct = interpolate(barProgress, [0, 1], [0, targetHeightPct]);
            const valueOpacity = interpolate(barProgress, [0.8, 1], [0, 1], { extrapolateLeft: "clamp" });

            // Phase 2: Spotlight calculation
            const mySpotlightStart = spotlightStart + Math.round(index * spotlightSlot);
            const mySpotlightEnd = mySpotlightStart + Math.round(spotlightSlot);
            
            // How "active" is this bar's spotlight (0 to 1 to 0)
            const spotlightIn = interpolate(
              frame,
              [mySpotlightStart, mySpotlightStart + Math.round(fps * 0.3)],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            const spotlightOut = interpolate(
              frame,
              [mySpotlightEnd - Math.round(fps * 0.3), mySpotlightEnd],
              [1, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            const spotlightIntensity = Math.min(spotlightIn, spotlightOut);

            // Are we in the spotlight phase at all?
            const inSpotlightPhase = frame >= spotlightStart;

            // Visual effects driven by spotlight
            const barScale = 1 + spotlightIntensity * 0.06;
            const barBrightness = inSpotlightPhase ? 0.55 + spotlightIntensity * 0.45 : 1;
            const glowStrength = Math.round(spotlightIntensity * 25);
            const labelScale = 1 + spotlightIntensity * 0.15;

            // Base color: last bar is accent, others are primary
            const baseColor = index === data.length - 1 ? styleGuide.color.accent : styleGuide.color.primary;

            // Glow color based on base
            const glowColor = index === data.length - 1
              ? `rgba(255, 0, 51, ${spotlightIntensity * 0.7})`
              : `rgba(255, 204, 0, ${spotlightIntensity * 0.7})`;

            return (
              <div
                key={index}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "20px",
                  height: "100%",
                  filter: `brightness(${barBrightness})`,
                  transition: "filter 0.3s ease",
                }}
              >
                {/* The Bar Container (growing upward) */}
                <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end", position: "relative" }}>
                  <div
                    style={{
                      width: "100%",
                      height: `${currentHeightPct}%`,
                      backgroundColor: baseColor,
                      boxShadow: glowStrength > 0
                        ? `0 0 ${glowStrength}px ${glowColor}, 0 10px 20px rgba(0,0,0,0.5)`
                        : "0 10px 20px rgba(0,0,0,0.5)",
                      border: spotlightIntensity > 0.5
                        ? `2px solid rgba(255, 255, 255, ${spotlightIntensity * 0.6})`
                        : "2px solid transparent",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "flex-start",
                      paddingTop: "20px",
                      transform: `scaleY(${barScale})`,
                      transformOrigin: "bottom",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: styleGuide.typography.fontFamilies.display,
                        fontSize: `${styleGuide.typography.scale.h3}px`,
                        color: styleGuide.color.surface,
                        fontWeight: "bold",
                        opacity: valueOpacity,
                        textShadow: spotlightIntensity > 0.3
                          ? `0 0 10px rgba(255, 255, 255, ${spotlightIntensity * 0.8})`
                          : "0 2px 5px rgba(0,0,0,0.3)",
                        transform: `scale(${1 + spotlightIntensity * 0.2})`,
                      }}
                    >
                      {item.value}
                    </span>
                  </div>
                </div>

                {/* X-Axis Label */}
                <div
                  style={{
                    fontFamily: styleGuide.typography.fontFamilies.body,
                    fontSize: `${styleGuide.typography.scale.body}px`,
                    color: spotlightIntensity > 0.3 ? styleGuide.color.text : styleGuide.color.textMuted,
                    fontWeight: spotlightIntensity > 0.5 ? "bold" : "normal",
                    transform: `scale(${labelScale})`,
                    textShadow: spotlightIntensity > 0.3
                      ? `0 0 8px ${glowColor}`
                      : "none",
                  }}
                >
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* On-Screen Text */}
      <div
        style={{
          position: "absolute",
          bottom: styleGuide.layout.safeMarginPx,
          left: styleGuide.layout.safeMarginPx,
          right: styleGuide.layout.safeMarginPx,
          fontFamily: styleGuide.typography.fontFamilies.body,
          fontSize: `${styleGuide.typography.scale.body}px`,
          color: styleGuide.color.text,
          textAlign: "center",
          textShadow: "0 4px 10px rgba(0,0,0,0.8)",
        }}
      >
        {scene.onScreenText || ""}
      </div>
    </AbsoluteFill>
  );
};
