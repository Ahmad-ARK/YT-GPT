import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Img, staticFile } from "remotion";
import { Scene, StyleGuide } from "../types/schema";

interface CinematicPhotoSceneProps {
  styleGuide: StyleGuide;
  scene: Scene;
  durationMs: number;
}

export const CinematicPhotoScene: React.FC<CinematicPhotoSceneProps> = ({ styleGuide, scene, durationMs }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const totalFrames = Math.max(1, Math.floor(durationMs / 1000 * fps));
  const directive = JSON.parse(scene.visual.directive || "{}");
  
  const imageRef = directive.imageRef || "placeholder.jpg";
  const caption = directive.caption || "";
  const motion = directive.motion || "zoom-in"; // 'zoom-in', 'zoom-out', 'pan-left', 'pan-right', 'pan-up', 'pan-down'

  // --- ANIMATION TIMING ---
  const fadeIn = interpolate(frame, [0, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [totalFrames - 30, totalFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = Math.min(fadeIn, fadeOut);

  // --- KEN BURNS EFFECT ---
  let scaleX = 1;
  let scaleY = 1;
  let translateX = 0;
  let translateY = 0;

  // We start scaled up slightly so we have room to pan without exposing the background
  const baseScale = 1.15;
  const targetScale = 1.35;
  const panAmount = 100; // pixels to pan

  if (motion === "zoom-in") {
    const s = interpolate(frame, [0, totalFrames], [baseScale, targetScale], { extrapolateRight: "clamp" });
    scaleX = s; scaleY = s;
  } else if (motion === "zoom-out") {
    const s = interpolate(frame, [0, totalFrames], [targetScale, baseScale], { extrapolateRight: "clamp" });
    scaleX = s; scaleY = s;
  } else if (motion === "pan-left") {
    scaleX = baseScale; scaleY = baseScale;
    translateX = interpolate(frame, [0, totalFrames], [panAmount, -panAmount], { extrapolateRight: "clamp" });
  } else if (motion === "pan-right") {
    scaleX = baseScale; scaleY = baseScale;
    translateX = interpolate(frame, [0, totalFrames], [-panAmount, panAmount], { extrapolateRight: "clamp" });
  } else if (motion === "pan-up") {
    scaleX = baseScale; scaleY = baseScale;
    translateY = interpolate(frame, [0, totalFrames], [panAmount, -panAmount], { extrapolateRight: "clamp" });
  } else if (motion === "pan-down") {
    scaleX = baseScale; scaleY = baseScale;
    translateY = interpolate(frame, [0, totalFrames], [-panAmount, panAmount], { extrapolateRight: "clamp" });
  }

  // --- FILM GRAIN (SVG FILTER) ---
  const grainId = `grain-${scene.id}`;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", opacity }}>
      
      {/* SVG Definitions for Film Grain */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter id={grainId}>
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 0.25 0" />
        </filter>
      </svg>

      {/* The Image Container with Ken Burns Transform */}
      <AbsoluteFill style={{ 
        justifyContent: "center", 
        alignItems: "center",
        transform: `scale(${scaleX}) translate(${translateX}px, ${translateY}px)`
      }}>
        <Img 
          src={staticFile(`assets/${imageRef}`)} 
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover", // Ensures the image fills the screen
            boxShadow: "0 0 100px rgba(0,0,0,0.8)" 
          }}
        />
      </AbsoluteFill>

      {/* Film Grain Overlay */}
      <AbsoluteFill style={{
        pointerEvents: "none",
        opacity: 0.8,
        mixBlendMode: "overlay"
      }}>
        <rect width="100%" height="100%" filter={`url(#${grainId})`} />
      </AbsoluteFill>

      {/* Heavy Vignette Overlay */}
      <AbsoluteFill style={{
        background: "radial-gradient(circle, transparent 40%, rgba(0,0,0,0.85) 120%)",
        pointerEvents: "none"
      }} />

      {/* Optional Caption inside the scene */}
      {caption && (
        <div style={{
          position: "absolute",
          bottom: "15%",
          left: "0",
          right: "0",
          textAlign: "center",
          fontFamily: styleGuide.typography.fontFamilies.body,
          fontSize: 32,
          color: "rgba(255,255,255,0.7)",
          letterSpacing: 4,
          textTransform: "uppercase",
          textShadow: "0 4px 10px rgba(0,0,0,0.9)"
        }}>
          {caption}
        </div>
      )}

      {/* Global On-Screen Text */}
      <div style={{
        position: "absolute",
        bottom: styleGuide.layout.safeMarginPx,
        left: styleGuide.layout.safeMarginPx,
        right: styleGuide.layout.safeMarginPx,
        fontFamily: styleGuide.typography.fontFamilies.body,
        fontSize: `${styleGuide.typography.scale.body}px`,
        color: styleGuide.color.text,
        textAlign: "center",
        textShadow: "0 4px 10px rgba(0,0,0,0.8)",
        zIndex: 10
      }}>
        {scene.onScreenText || ""}
      </div>
      
    </AbsoluteFill>
  );
};
