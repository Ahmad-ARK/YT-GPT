import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { Scene, StyleGuide } from "../types/schema";

interface TimelineSceneProps {
  styleGuide: StyleGuide;
  scene: Scene;
  durationMs: number;
}

export const TimelineScene: React.FC<TimelineSceneProps> = ({ styleGuide, scene, durationMs }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const directive = JSON.parse(scene.visual.directive || "{}");
  const events = directive.events || [];

  const totalFrames = Math.max(1, Math.floor((durationMs) / 1000 * fps));

  // The main timeline line draws downwards
  const lineProgress = spring({
    frame: Math.max(0, frame - 15),
    fps,
    config: { damping: 50, stiffness: 20 }, // Very slow draw
  });
  
  // Assuming a max height of 600px for the timeline UI
  const lineDrawHeight = interpolate(lineProgress, [0, 1], [0, 600], { extrapolateRight: "clamp" });

  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // Stagger each event
  const staggerFrames = Math.round(fps * 1.5); // 1.5 seconds between events

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
          position: "relative",
          width: "800px",
          height: "600px",
          display: "flex",
        }}
      >
        {/* The Vertical Line */}
        <div
          style={{
            position: "absolute",
            left: "50px", // Offset from left
            top: 0,
            width: "4px",
            height: `${lineDrawHeight}px`,
            backgroundColor: styleGuide.color.primary,
            boxShadow: "0 0 10px rgba(255,204,0,0.5)",
          }}
        />

        {/* The Events */}
        {events.map((ev: any, index: number) => {
          const evFrame = Math.max(0, frame - 30 - index * staggerFrames);
          
          const evProgress = spring({
            frame: evFrame,
            fps,
            config: { damping: 15 },
          });

          // Only show the node if the line has drawn past it
          const yPosition = (index * 600) / Math.max(1, events.length - 1 || 1);
          const isLinePast = lineDrawHeight >= yPosition;
          
          // Actually, we'll let the spring handle the pop-in right when the line gets there
          // by tuning staggerFrames. For now, just use evProgress.

          const nodeScale = interpolate(evProgress, [0, 1], [0, 1]);
          const textOpacity = interpolate(evProgress, [0, 1], [0, 1]);
          const textTranslateX = interpolate(evProgress, [0, 1], [20, 0]);

          return (
            <React.Fragment key={index}>
              {/* Event Node (Dot) */}
              <div
                style={{
                  position: "absolute",
                  left: "52px",
                  top: `${yPosition}px`,
                  width: "16px",
                  height: "16px",
                  backgroundColor: styleGuide.color.accent,
                  borderRadius: "50%",
                  transform: `translate(-50%, -50%) scale(${nodeScale})`,
                  boxShadow: "0 0 10px rgba(255,0,51,0.8)",
                }}
              />
              
              {/* Event Text */}
              <div
                style={{
                  position: "absolute",
                  left: "90px",
                  top: `${yPosition}px`,
                  transform: `translateY(-50%) translateX(${textTranslateX}px)`,
                  opacity: textOpacity,
                  display: "flex",
                  alignItems: "baseline",
                  gap: "15px",
                }}
              >
                <span
                  style={{
                    fontFamily: styleGuide.typography.fontFamilies.display,
                    fontSize: `${styleGuide.typography.scale.h2}px`,
                    color: styleGuide.color.primary,
                    fontWeight: "bold",
                  }}
                >
                  {ev.year}
                </span>
                <span
                  style={{
                    fontFamily: styleGuide.typography.fontFamilies.body,
                    fontSize: `${styleGuide.typography.scale.body}px`,
                    color: styleGuide.color.text,
                  }}
                >
                  {ev.title}
                </span>
              </div>
            </React.Fragment>
          );
        })}
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
