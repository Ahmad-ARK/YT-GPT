import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { Scene, StyleGuide } from "../types/schema";

interface StatSceneProps {
  styleGuide: StyleGuide;
  scene: Scene;
  durationMs: number;
}

export const StatScene: React.FC<StatSceneProps> = ({ styleGuide, scene, durationMs }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const directive = JSON.parse(scene.visual.directive || "{}");
  const targetValue = directive.value || 100;
  const prefix = directive.prefix || "";
  const suffix = directive.suffix || "";
  const label = directive.label || "";

  // Animate the number counting up
  const countProgress = spring({
    frame: Math.max(0, frame - 15),
    fps,
    config: { damping: 100, stiffness: 50, mass: 2 }, // Very slow, heavy ease-out
  });
  
  const currentValue = Math.floor(interpolate(countProgress, [0, 1], [0, targetValue]));

  // Entrance fade
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // Label entrance
  const labelProgress = spring({
    frame: Math.max(0, frame - 45), // Comes in after the counter starts
    fps,
    config: { damping: 15 },
  });
  
  const labelOpacity = interpolate(labelProgress, [0, 1], [0, 1]);
  const labelTranslateY = interpolate(labelProgress, [0, 1], [20, 0]);

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
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontFamily: styleGuide.typography.fontFamilies.display,
            fontSize: "180px", // Huge impact font
            color: styleGuide.color.primary,
            fontWeight: "bold",
            lineHeight: 1,
            textShadow: "0 10px 40px rgba(255,204,0,0.3)",
          }}
        >
          {prefix}{currentValue.toLocaleString()}{suffix}
        </div>
        
        {label && (
          <div
            style={{
              fontFamily: styleGuide.typography.fontFamilies.body,
              fontSize: `${styleGuide.typography.scale.h2}px`,
              color: styleGuide.color.text,
              marginTop: "20px",
              transform: `translateY(${labelTranslateY}px)`,
              opacity: labelOpacity,
            }}
          >
            {label}
          </div>
        )}
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
