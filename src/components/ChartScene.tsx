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

  // Entrance fade
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
            const stagger = 15;
            const barProgress = spring({
              frame: Math.max(0, frame - 15 - index * stagger),
              fps,
              config: { damping: 12 },
            });

            // Calculate height percentage
            const targetHeightPct = (item.value / maxValue) * 100;
            const currentHeightPct = interpolate(barProgress, [0, 1], [0, targetHeightPct]);
            
            const valueOpacity = interpolate(barProgress, [0.8, 1], [0, 1], { extrapolateLeft: "clamp" });

            return (
              <div key={index} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", height: "100%" }}>
                {/* The Bar Container (growing upward) */}
                <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end", position: "relative" }}>
                  <div
                    style={{
                      width: "100%",
                      height: `${currentHeightPct}%`,
                      backgroundColor: index === data.length - 1 ? styleGuide.color.accent : styleGuide.color.primary,
                      boxShadow: "0 10px 20px rgba(0,0,0,0.5)",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "flex-start",
                      paddingTop: "20px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: styleGuide.typography.fontFamilies.display,
                        fontSize: `${styleGuide.typography.scale.h3}px`,
                        color: styleGuide.color.surface,
                        fontWeight: "bold",
                        opacity: valueOpacity,
                        textShadow: "0 2px 5px rgba(0,0,0,0.3)"
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
                    color: styleGuide.color.textMuted,
                  }}
                >
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Narrative Text */}
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
        {scene.narration}
      </div>
    </AbsoluteFill>
  );
};
