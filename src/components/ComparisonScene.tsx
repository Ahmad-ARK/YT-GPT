import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Img } from "remotion";
import { Scene, StyleGuide } from "../types/schema";
import { getTriggerFrame } from "../utils/timing";

interface ComparisonSceneProps {
  styleGuide: StyleGuide;
  scene: Scene;
  durationMs: number;
}

export const ComparisonScene: React.FC<ComparisonSceneProps> = ({ styleGuide, scene, durationMs }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const directive = JSON.parse(scene.visual.directive || "{}");
  const left = directive.left || { title: "Left", subtitle: "", points: [] };
  const right = directive.right || { title: "Right", subtitle: "", points: [] };
  const title = directive.title || "";

  const totalFrames = Math.max(1, Math.floor((durationMs) / 1000 * fps));

  // Base Animations
  const dividerProgress = spring({ frame, fps, config: { damping: 15, mass: 1 } });
  const leftPanelProgress = spring({ frame: Math.max(0, frame - 15), fps, config: { damping: 14 } });
  const rightPanelProgress = spring({ frame: Math.max(0, frame - 30), fps, config: { damping: 14 } });

  // Focus Animations (driven by speaker words)
  const leftTriggerFrame = getTriggerFrame(scene, left.triggerWord, totalFrames, 15);
  const rightTriggerFrame = getTriggerFrame(scene, right.triggerWord, totalFrames, totalFrames / 2);

  // Springs for focus state transitions
  const leftFocusIn = spring({ frame: Math.max(0, frame - leftTriggerFrame), fps, config: { damping: 14 } });
  const leftFocusOut = spring({ frame: Math.max(0, frame - rightTriggerFrame), fps, config: { damping: 14 } });
  const leftFocus = leftFocusIn - leftFocusOut; // Goes 0 -> 1 -> 0

  const rightFocusIn = spring({ frame: Math.max(0, frame - rightTriggerFrame), fps, config: { damping: 14 } });
  const rightFocus = rightFocusIn; // Goes 0 -> 1

  const leftScale = interpolate(leftFocus, [0, 1], [1, 1.05], { extrapolateRight: "clamp" });
  const leftDim = interpolate(rightFocus, [0, 1], [1, 0.3], { extrapolateRight: "clamp" });

  const rightScale = interpolate(rightFocus, [0, 1], [1, 1.05], { extrapolateRight: "clamp" });
  const rightDim = interpolate(leftFocus, [0, 1], [1, 0.3], { extrapolateRight: "clamp" });

  // Ambient Motion
  const bgScale = interpolate(frame, [0, totalFrames], [1, 1.15]);
  const leftPan = interpolate(frame, [0, totalFrames], [0, -20]);
  const rightPan = interpolate(frame, [0, totalFrames], [0, 20]);

  // Entrance/exit fade
  const fadeFrames = 20;
  const opacity = interpolate(
    frame,
    [0, fadeFrames, totalFrames - fadeFrames, totalFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: styleGuide.color.bg, opacity, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Top Title */}
      {title && (
        <div style={{
          position: "absolute", top: "60px", width: "100%", textAlign: "center",
          fontFamily: styleGuide.typography.fontFamilies.display, fontSize: `${styleGuide.typography.scale.h2}px`,
          color: styleGuide.color.text, zIndex: 10, opacity: leftPanelProgress, textShadow: "0 5px 15px rgba(0,0,0,0.9)",
          letterSpacing: "4px", textTransform: "uppercase"
        }}>
          {title}
        </div>
      )}

      <div style={{ flex: 1, display: "flex", position: "relative" }}>
        {/* Left Panel */}
        <div style={{ 
          flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
          transform: `translateX(${interpolate(leftPanelProgress, [0, 1], [-100, 0]) + leftPan}px) scale(${leftScale})`,
          opacity: leftDim * Number(leftPanelProgress), padding: "50px", position: "relative", overflow: "hidden",
          zIndex: leftFocus > 0.5 ? 2 : 1, transition: "opacity 0.2s"
        }}>
           {left.imageRef && (
             <>
               <Img src={left.imageRef} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", objectFit: "cover", transform: `scale(${bgScale})`, zIndex: -2 }} />
               <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.4))", zIndex: -1 }} />
             </>
           )}

           <h2 style={{ fontFamily: styleGuide.typography.fontFamilies.display, fontSize: `${styleGuide.typography.scale.h1}px`, color: styleGuide.color.primary, margin: "0 0 10px 0", textAlign: "center", textShadow: "0 4px 10px rgba(0,0,0,0.8)", transform: `scale(${interpolate(leftFocus, [0,1], [1, 1.1])})` }}>{left.title}</h2>
           {left.subtitle && (
             <h3 style={{ fontFamily: styleGuide.typography.fontFamilies.body, fontSize: `${styleGuide.typography.scale.h3}px`, color: styleGuide.color.text, margin: "0 0 30px 0", textAlign: "center", maxWidth: "80%", textShadow: "0 2px 5px rgba(0,0,0,0.8)" }}>{left.subtitle}</h3>
           )}

           {/* Word-Driven Left Points */}
           {left.points && left.points.length > 0 && (
             <div style={{ display: "flex", flexDirection: "column", gap: "15px", alignItems: "flex-start" }}>
               {left.points.map((pt: any, idx: number) => {
                 const triggerFrame = getTriggerFrame(scene, pt.triggerWord, totalFrames, 45 + idx * 20);
                 const ptProgress = spring({ frame: Math.max(0, frame - triggerFrame), fps, config: { damping: 12 } });
                 
                 return (
                   <div key={idx} style={{
                     display: "flex", alignItems: "center", gap: "10px", opacity: ptProgress,
                     transform: `translateX(${interpolate(ptProgress, [0, 1], [-20, 0])}px)`,
                     fontFamily: styleGuide.typography.fontFamilies.body, fontSize: "28px",
                     color: styleGuide.color.textMuted, textShadow: "0 2px 5px rgba(0,0,0,0.8)"
                   }}>
                     <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: styleGuide.color.primary }} />
                     {pt.text || pt}
                   </div>
                 );
               })}
             </div>
           )}
        </div>

        {/* Right Panel */}
        <div style={{ 
          flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
          transform: `translateX(${interpolate(rightPanelProgress, [0, 1], [100, 0]) + rightPan}px) scale(${rightScale})`,
          opacity: rightDim * Number(rightPanelProgress), padding: "50px", position: "relative", overflow: "hidden",
          zIndex: rightFocus > 0.5 ? 2 : 1, transition: "opacity 0.2s"
        }}>
           {right.imageRef && (
             <>
               <Img src={right.imageRef} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", objectFit: "cover", transform: `scale(${bgScale})`, zIndex: -2 }} />
               <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.4))", zIndex: -1 }} />
             </>
           )}

           <h2 style={{ fontFamily: styleGuide.typography.fontFamilies.display, fontSize: `${styleGuide.typography.scale.h1}px`, color: styleGuide.color.accent, margin: "0 0 10px 0", textAlign: "center", textShadow: "0 4px 10px rgba(0,0,0,0.8)", transform: `scale(${interpolate(rightFocus, [0,1], [1, 1.1])})` }}>{right.title}</h2>
           {right.subtitle && (
             <h3 style={{ fontFamily: styleGuide.typography.fontFamilies.body, fontSize: `${styleGuide.typography.scale.h3}px`, color: styleGuide.color.text, margin: "0 0 30px 0", textAlign: "center", maxWidth: "80%", textShadow: "0 2px 5px rgba(0,0,0,0.8)" }}>{right.subtitle}</h3>
           )}

           {/* Word-Driven Right Points */}
           {right.points && right.points.length > 0 && (
             <div style={{ display: "flex", flexDirection: "column", gap: "15px", alignItems: "flex-start" }}>
               {right.points.map((pt: any, idx: number) => {
                 const triggerFrame = getTriggerFrame(scene, pt.triggerWord, totalFrames, 90 + idx * 20);
                 const ptProgress = spring({ frame: Math.max(0, frame - triggerFrame), fps, config: { damping: 12 } });
                 
                 return (
                   <div key={idx} style={{
                     display: "flex", alignItems: "center", gap: "10px", opacity: ptProgress,
                     transform: `translateX(${interpolate(ptProgress, [0, 1], [20, 0])}px)`,
                     fontFamily: styleGuide.typography.fontFamilies.body, fontSize: "28px",
                     color: styleGuide.color.textMuted, textShadow: "0 2px 5px rgba(0,0,0,0.8)"
                   }}>
                     <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: styleGuide.color.accent }} />
                     {pt.text || pt}
                   </div>
                 );
               })}
             </div>
           )}
        </div>

        {/* Center Divider Line & Badge */}
        <div style={{ position: "absolute", left: "50%", top: "15%", bottom: "15%", width: "6px", backgroundColor: styleGuide.color.text, transform: `translateX(-50%) scaleY(${dividerProgress})`, transformOrigin: "center", boxShadow: `0 0 20px rgba(0,0,0,1)`, zIndex: 5 }} />
        <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(-50%, -50%) scale(${interpolate(rightPanelProgress, [0, 0.5, 1], [0, 1.2, 1])})`, opacity: rightPanelProgress, backgroundColor: styleGuide.color.bg, border: `3px solid ${styleGuide.color.text}`, borderRadius: "50%", width: "90px", height: "90px", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: styleGuide.typography.fontFamilies.display, fontSize: "35px", color: styleGuide.color.text, fontWeight: "bold", boxShadow: "0 10px 25px rgba(0,0,0,0.8)", zIndex: 6 }}>VS</div>
      </div>

      <div style={{ position: "absolute", bottom: styleGuide.layout.safeMarginPx, left: styleGuide.layout.safeMarginPx, right: styleGuide.layout.safeMarginPx, fontFamily: styleGuide.typography.fontFamilies.body, fontSize: `${styleGuide.typography.scale.body}px`, color: styleGuide.color.text, textAlign: "center", textShadow: "0 4px 10px rgba(0,0,0,0.8)", zIndex: 10 }}>{scene.onScreenText || ""}</div>
    </AbsoluteFill>
  );
};
