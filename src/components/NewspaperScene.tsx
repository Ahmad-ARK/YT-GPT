import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { Scene, StyleGuide } from "../types/schema";

interface NewspaperSceneProps {
  styleGuide: StyleGuide;
  scene: Scene;
  durationMs: number;
}

export const NewspaperScene: React.FC<NewspaperSceneProps> = ({ styleGuide, scene, durationMs }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const directive = JSON.parse(scene.visual.directive || "{}");
  const headline = directive.headline || "EXTRA! EXTRA!";
  const subhead = directive.subhead || "Read all about it in today's breaking news. The event shook the world.";
  const date = directive.date || "OCTOBER 24, 1929";
  const paperName = directive.paperName || "THE DAILY CHRONICLE";

  const totalFrames = Math.max(1, Math.floor((durationMs) / 1000 * fps));

  // 1. Slam and spin animation (0 to ~30 frames)
  const slamSpring = spring({
    frame,
    fps,
    config: { damping: 12, mass: 2, stiffness: 80 },
  });
  
  const slamRotation = interpolate(slamSpring, [0, 1], [720, 0]);
  const slamZ = interpolate(slamSpring, [0, 1], [-1500, 0]);

  // 2. Camera zoom and pan (starts after slam)
  // We want to zoom into the subhead and slowly pan across it.
  const zoomStartFrame = 40;
  
  // Smooth easing for camera zoom
  const cameraScale = interpolate(
    frame,
    [zoomStartFrame, totalFrames],
    [1, 1.6],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Pan right and slightly down to track the subhead
  const cameraX = interpolate(
    frame,
    [zoomStartFrame, totalFrames],
    [0, -150],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  
  const cameraY = interpolate(
    frame,
    [zoomStartFrame, totalFrames],
    [0, -80],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // 3. Highlighter Animation on the subhead
  // It wipes from left to right as the camera pans.
  const highlightProgress = interpolate(
    frame,
    [zoomStartFrame + 10, totalFrames - 20],
    [0, 100],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // 4. Fade in/out
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
        opacity,
        perspective: 1200,
      }}
    >
      {/* Camera Rig Container */}
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          transformOrigin: "center center",
          transform: `scale(${cameraScale}) translateX(${cameraX}px) translateY(${cameraY}px)`,
        }}
      >
        {/* Newspaper Slam Container */}
        <div
          style={{
            width: "1200px",
            height: "850px",
            backgroundColor: "#eae3d2", // Darker vintage paper color
            boxShadow: "0 30px 60px rgba(0,0,0,0.9)",
            transform: `scale(${slamSpring}) rotate(${slamRotation}deg) translateZ(${slamZ}px)`,
            display: "flex",
            flexDirection: "column",
            padding: "50px",
            color: "#1a1a1a",
            position: "relative",
            overflow: "hidden",
            border: "1px solid #c9bda4",
          }}
        >
          {/* Vintage Grunge Texture Overlay */}
          <svg
            style={{
              position: "absolute",
              top: 0, left: 0, right: 0, bottom: 0,
              width: "100%", height: "100%",
              pointerEvents: "none",
              opacity: 0.4,
              mixBlendMode: "multiply",
              zIndex: 10
            }}
          >
            <filter id="grunge">
              <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="4" stitchTiles="stitch" />
              <feColorMatrix type="matrix" values="0 0 0 0 0.8  0 0 0 0 0.7  0 0 0 0 0.6  0 0 0 1 0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#grunge)" />
          </svg>

          {/* Paper Header */}
          <div style={{ textAlign: "center", borderBottom: "5px solid #1a1a1a", paddingBottom: "20px", marginBottom: "30px", zIndex: 1 }}>
            <h1 style={{ 
              fontFamily: "'Playfair Display', serif, Times New Roman", 
              fontSize: "65px", 
              margin: 0, 
              letterSpacing: "6px",
              textTransform: "uppercase",
              fontWeight: 900
            }}>
              {paperName}
            </h1>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              borderTop: "2px solid #1a1a1a", 
              borderBottom: "2px solid #1a1a1a", 
              marginTop: "10px", 
              padding: "6px 0",
              fontFamily: "monospace",
              fontSize: "22px",
              fontWeight: "bold",
              textTransform: "uppercase"
            }}>
              <span>Vol. XLII No. 104</span>
              <span>{date}</span>
              <span>Price 5 Cents</span>
            </div>
          </div>

          {/* Headline & Subhead Area */}
          <div style={{ textAlign: "center", marginBottom: "40px", zIndex: 1 }}>
            <h2 style={{ 
              fontFamily: "'Playfair Display', serif, Times New Roman", 
              fontSize: headline.length > 30 ? "90px" : "110px", 
              lineHeight: 1.05,
              margin: "0 0 25px 0",
              fontWeight: 900,
              textTransform: "uppercase"
            }}>
              {headline}
            </h2>
            
            {/* The Subhead (This gets highlighted) */}
            <div style={{ position: "relative", display: "inline-block" }}>
              <h3 style={{
                fontFamily: "sans-serif",
                fontSize: "38px",
                fontWeight: "normal",
                fontStyle: "italic",
                color: "#333",
                margin: 0,
                position: "relative",
                zIndex: 2, // Text stays above the highlighter
                padding: "0 10px"
              }}>
                {subhead}
              </h3>
              
              {/* SVG Highlighter wipe */}
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                bottom: 0,
                width: `${highlightProgress}%`, // Wipes from left to right
                backgroundColor: "rgba(255, 235, 59, 0.6)", // Neon yellow highlight
                mixBlendMode: "multiply", // Blends with paper and text underneath
                zIndex: 1, // Sits between paper and text
                transformOrigin: "left center",
              }} />
            </div>
          </div>

          {/* Mock Columns */}
          <div style={{ display: "flex", gap: "40px", flex: 1, zIndex: 1 }}>
            {[1, 2, 3].map((col) => (
              <div key={col} style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ height: "4px", width: "100%", backgroundColor: "#1a1a1a" }}></div>
                <div style={{ fontFamily: "serif", fontSize: "17px", lineHeight: 1.5, color: "#444", textAlign: "justify" }}>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                  <br/><br/>
                  Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* On-Screen Text - Using styleGuide font for modern overlay */}
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
          opacity: interpolate(slamSpring, [0.8, 1], [0, 1]), // Fade in after slam
        }}
      >
        {scene.onScreenText || ""}
      </div>
    </AbsoluteFill>
  );
};
