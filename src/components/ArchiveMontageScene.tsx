import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img } from "remotion";
import { Scene, StyleGuide } from "../types/schema";

interface ArchiveMontageSceneProps {
  styleGuide: StyleGuide;
  scene: Scene;
  durationMs: number;
}

export const ArchiveMontageScene: React.FC<ArchiveMontageSceneProps> = ({ styleGuide, scene, durationMs }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const totalFrames = Math.max(1, Math.floor((durationMs) / 1000 * fps));

  // Use assets from scene, or fallback to dummy images for testing
  const assets = scene.visual.assets || [
    { ref: "https://images.pexels.com/photos/74284/pexels-photo-74284.jpeg?auto=compress&cs=tinysrgb&w=800", kind: "image" },
    { ref: "https://images.pexels.com/photos/33358/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800", kind: "image" },
    { ref: "https://images.pexels.com/photos/378276/pexels-photo-378276.jpeg?auto=compress&cs=tinysrgb&w=800", kind: "image" }
  ];

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
        opacity: opacity,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden"
      }}
    >
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        {assets.map((asset: any, index: number) => {
          // Stagger each image entrance by 1 second (30 frames)
          const staggerFrames = 30;
          const imageFrame = Math.max(0, frame - index * staggerFrames);

          const imageProgress = spring({
            frame: imageFrame,
            fps,
            config: { damping: 15, mass: 1.5 },
          });

          // Animate opacity and Y-translation to float in
          const imgOpacity = interpolate(imageProgress, [0, 1], [0, 1]);
          const imgTranslateY = interpolate(imageProgress, [0, 1], [100, 0]);
          
          // Continuous Ken Burns zoom on each individual image
          const kenBurnsScale = interpolate(frame, [0, totalFrames], [1, 1.15]);
          
          // Scatter positions procedurally based on index
          // We want them layered like a pile of photographs
          const rotation = (index % 2 === 0 ? 1 : -1) * (index * 5 + 2); // alternating angles
          
          let leftPos = "50%";
          let topPos = "50%";
          
          // Just a simple layout hack for up to 3 images:
          if (index === 0) { leftPos = "30%"; topPos = "40%"; }
          else if (index === 1) { leftPos = "70%"; topPos = "45%"; }
          else if (index === 2) { leftPos = "50%"; topPos = "60%"; }

          return (
            <div
              key={index}
              style={{
                position: "absolute",
                left: leftPos,
                top: topPos,
                transform: `translate(-50%, -50%) translateY(${imgTranslateY}px) rotate(${rotation}deg)`,
                opacity: imgOpacity,
                width: "800px",
                height: "600px",
                boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
                border: "15px solid white", // Polaroid/Archive feel
                backgroundColor: "#fff",
                overflow: "hidden",
                zIndex: index, // Stack later images on top
              }}
            >
              <Img
                src={asset.ref}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: `scale(${kenBurnsScale})`, // The slow zoom
                }}
              />
            </div>
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
          zIndex: 999, // Ensure text is always on top of images
        }}
      >
        {scene.narration}
      </div>
    </AbsoluteFill>
  );
};
