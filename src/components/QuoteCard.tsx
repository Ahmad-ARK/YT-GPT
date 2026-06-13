import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { Scene, StyleGuide } from "../types/schema";

interface QuoteCardProps {
  styleGuide: StyleGuide;
  scene: Scene;
  durationMs: number;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({ styleGuide, scene, durationMs }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const directive = JSON.parse(scene.visual.directive || "{}");
  const quote = directive.quote || "History is written by the victors.";
  const author = directive.author || "Winston Churchill";
  const context = directive.context || "1940";

  const totalFrames = Math.max(1, Math.floor((durationMs) / 1000 * fps));

  // Slow subtle cinematic drift
  const driftY = interpolate(frame, [0, totalFrames], [0, -20]);
  const scale = interpolate(frame, [0, totalFrames], [1, 1.05]);

  // Entrance fade
  const fadeFrames = 20;
  const opacity = interpolate(
    frame,
    [0, fadeFrames, totalFrames - fadeFrames, totalFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Typewriter effect for the quote
  const charsPerFrame = 1.5;
  const charsToShow = Math.floor(frame * charsPerFrame);
  const displayedQuote = quote.slice(0, charsToShow);

  // Author entrance
  const authorProgress = spring({
    frame: Math.max(0, frame - Math.floor(quote.length / charsPerFrame) - 15),
    fps,
    config: { damping: 15 },
  });
  
  const authorOpacity = interpolate(authorProgress, [0, 1], [0, 1]);
  const authorTranslateY = interpolate(authorProgress, [0, 1], [10, 0]);

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
          width: "70%",
          transform: `scale(${scale}) translateY(${driftY}px)`,
          display: "flex",
          flexDirection: "column",
          gap: "40px"
        }}
      >
        {/* Giant quotation marks */}
        <div
          style={{
            fontFamily: styleGuide.typography.fontFamilies.display,
            fontSize: "120px",
            color: styleGuide.color.primary,
            opacity: 0.3,
            lineHeight: 0.5,
            position: "absolute",
            top: "-40px",
            left: "-60px",
          }}
        >
          &ldquo;
        </div>

        <div
          style={{
            fontFamily: styleGuide.typography.fontFamilies.display,
            fontSize: `${styleGuide.typography.scale.h1}px`,
            color: styleGuide.color.text,
            lineHeight: 1.2,
            textShadow: "0 10px 30px rgba(0,0,0,0.8)",
            zIndex: 1,
          }}
        >
          {displayedQuote}
        </div>
        
        <div
          style={{
            transform: `translateY(${authorTranslateY}px)`,
            opacity: authorOpacity,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            borderLeft: `4px solid ${styleGuide.color.accent}`,
            paddingLeft: "20px"
          }}
        >
          <div
            style={{
              fontFamily: styleGuide.typography.fontFamilies.display,
              fontSize: `${styleGuide.typography.scale.h2}px`,
              color: styleGuide.color.primary,
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            {author}
          </div>
          {context && (
            <div
              style={{
                fontFamily: styleGuide.typography.fontFamilies.body,
                fontSize: `${styleGuide.typography.scale.body}px`,
                color: styleGuide.color.textMuted,
                fontStyle: "italic",
              }}
            >
              {context}
            </div>
          )}
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
