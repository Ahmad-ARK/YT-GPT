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

  // Reserve 10% at start for fade-in, 10% at end for breathing room
  const animStartFrame = Math.round(totalFrames * 0.08);
  const animEndFrame = Math.round(totalFrames * 0.85);
  const animWindow = animEndFrame - animStartFrame;

  // Each event gets an evenly spaced slot across the animation window
  const slotFrames = events.length > 1 ? animWindow / (events.length - 1) : animWindow;

  // The line draws from animStartFrame to the last event's appearance
  const lineDrawHeight = interpolate(
    frame,
    [animStartFrame, animEndFrame],
    [0, 600],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

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
            left: "50px",
            top: 0,
            width: "4px",
            height: `${lineDrawHeight}px`,
            backgroundColor: styleGuide.color.primary,
            boxShadow: "0 0 10px rgba(255,204,0,0.5)",
          }}
        />

        {/* The Events */}
        {events.map((ev: any, index: number) => {
          // Each event appears at its evenly-spaced slot
          const eventAppearFrame = animStartFrame + Math.round(index * slotFrames);

          const evProgress = spring({
            frame: Math.max(0, frame - eventAppearFrame),
            fps,
            config: { damping: 15 },
          });

          const yPosition = events.length > 1
            ? (index * 600) / (events.length - 1)
            : 300;

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
