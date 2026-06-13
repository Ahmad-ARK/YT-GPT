import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { Scene, StyleGuide } from "../types/schema";

interface TitleCardProps {
  styleGuide: StyleGuide;
  scene: Scene;
  durationMs: number;
}

export const TitleCard: React.FC<TitleCardProps> = ({ styleGuide, scene, durationMs }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const directive = JSON.parse(scene.visual.directive || "{}");
  const title = directive.title || "TITLE";
  const subtitle = directive.subtitle || "";

  const totalFrames = Math.max(1, Math.floor((durationMs) / 1000 * fps));

  // Cinematic scale effect (very slow zoom)
  const scale = interpolate(frame, [0, totalFrames], [1, 1.1]);

  // Entrance and exit fade
  const fadeFrames = 30; // 1 second fade
  const opacity = interpolate(
    frame,
    [0, fadeFrames, totalFrames - fadeFrames, totalFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Stagger the subtitle entrance
  const subtitleProgress = spring({
    frame: Math.max(0, frame - 15),
    fps,
    config: { damping: 15 },
  });
  
  const subtitleOpacity = interpolate(subtitleProgress, [0, 1], [0, 1]);
  const subtitleTranslateY = interpolate(subtitleProgress, [0, 1], [20, 0]);

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
          transform: `scale(${scale})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px"
        }}
      >
        <div
          style={{
            fontFamily: styleGuide.typography.fontFamilies.display,
            fontSize: `${styleGuide.typography.scale.h1}px`,
            color: styleGuide.color.text,
            textTransform: "uppercase",
            letterSpacing: `${styleGuide.typography.tracking.h1}px`,
            textAlign: "center",
            textShadow: "0 10px 30px rgba(0,0,0,0.8)",
          }}
        >
          {title}
        </div>
        
        {subtitle && (
          <div
            style={{
              fontFamily: styleGuide.typography.fontFamilies.body,
              fontSize: `${styleGuide.typography.scale.h2}px`,
              color: styleGuide.color.primary,
              textTransform: "uppercase",
              letterSpacing: "4px",
              textAlign: "center",
              transform: `translateY(${subtitleTranslateY}px)`,
              opacity: subtitleOpacity,
              textShadow: "0 5px 15px rgba(0,0,0,0.8)",
            }}
          >
            {subtitle}
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
