import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { Scene, StyleGuide } from "../types/schema";
import { getTriggerFrame } from "../utils/timing";

interface DocumentSceneProps {
  styleGuide: StyleGuide;
  scene: Scene;
  durationMs: number;
}

/**
 * A realistic aged/declassified document with:
 * - Torn irregular edges via SVG clip-path
 * - Coffee stains & water damage via radial gradients
 * - Fold creases
 * - Uneven yellowing
 * - Proper organic vignette (no square corners)
 * - Word-triggered red-underline highlighting
 */
export const DocumentScene: React.FC<DocumentSceneProps> = ({ styleGuide, scene, durationMs }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const directive = JSON.parse(scene.visual.directive || "{}");
  const text: string = directive.text || "Lorem ipsum dolor sit amet.";
  const title: string = directive.title || "CLASSIFIED";
  const date: string = directive.date || "";
  const signature: string = directive.signature || "";
  const highlights: Array<{ match: string; triggerWord: string }> = directive.highlights || [];
  const classification: string = directive.classification || "TOP SECRET";
  const refNumber: string = directive.refNumber || "REF-" + Math.floor(Math.random() * 99999);

  const totalFrames = Math.max(1, Math.floor(durationMs / 1000 * fps));

  // --- ANIMATIONS ---

  // Phase 1: Document emerges from darkness (0 → 40 frames)
  const fadeIn = interpolate(frame, [0, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  
  // Phase 2: Document settles onto the "desk" with a slight bounce
  const settleY = spring({ frame, fps, config: { damping: 12, stiffness: 80, mass: 0.8 } });
  const settleRotation = spring({ frame, fps, config: { damping: 18, stiffness: 60 } });

  // Phase 3: Slow Ken Burns push-in with subtle drift
  const kbScale = interpolate(frame, [0, totalFrames], [1.0, 1.18], { extrapolateRight: "clamp" });
  const kbY = interpolate(frame, [0, totalFrames], [0, -40], { extrapolateRight: "clamp" });
  const kbX = interpolate(frame, [0, totalFrames], [0, 15], { extrapolateRight: "clamp" });

  // Phase 4: Stamp slams down (delayed start at frame 50)
  const stampFrame = Math.max(0, frame - 50);
  const stampDrop = spring({ frame: stampFrame, fps, config: { damping: 8, stiffness: 300, mass: 0.5 } });
  const stampShake = stampFrame > 0 && stampFrame < 10
    ? Math.sin(stampFrame * 8) * interpolate(stampFrame, [0, 10], [4, 0], { extrapolateRight: "clamp" })
    : 0;

  // Fade out
  const fadeOut = interpolate(frame, [totalFrames - 25, totalFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const masterOpacity = Math.min(fadeIn, fadeOut);

  // --- HIGHLIGHTED TEXT RENDERER ---
  const renderBody = () => {
    if (!highlights || highlights.length === 0) {
      return <span>{text}</span>;
    }

    let remaining = text;
    const parts: React.ReactNode[] = [];
    const sorted = [...highlights].sort((a, b) => text.indexOf(a.match) - text.indexOf(b.match));

    sorted.forEach((h, i) => {
      const idx = remaining.indexOf(h.match);
      if (idx === -1) return;

      // Text before this highlight
      if (idx > 0) parts.push(<span key={`pre-${i}`}>{remaining.substring(0, idx)}</span>);

      // Trigger animation
      const trigFrame = getTriggerFrame(scene.narration, h.triggerWord, totalFrames, 60 + i * 40);
      const progress = interpolate(frame - trigFrame, [0, 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

      parts.push(
        <span key={`hl-${i}`} style={{ position: "relative", display: "inline" }}>
          {h.match}
          {/* Red underline that draws from left to right */}
          <span style={{
            position: "absolute", bottom: "-2px", left: 0,
            width: `${progress * 100}%`, height: "4px",
            background: "linear-gradient(90deg, rgba(180,20,20,0.9), rgba(200,40,40,0.7))",
            borderRadius: "2px",
            boxShadow: progress > 0 ? "0 0 6px rgba(180,20,20,0.4)" : "none",
          }} />
        </span>
      );
      remaining = remaining.substring(idx + h.match.length);
    });

    if (remaining) parts.push(<span key="tail">{remaining}</span>);
    return parts;
  };

  // Unique SVG filter ID to avoid conflicts with other scenes
  const filterId = "doc-aged-tex";
  const filterId2 = "doc-fine-grain";

  // Torn edge clip-path (irregular polygon)
  const tornClip = `polygon(
    2% 0%, 5% 1%, 8% 0%, 12% 0.5%, 16% 0%, 20% 0.3%,
    25% 0%, 30% 0.8%, 35% 0%, 40% 0.2%, 45% 0%, 50% 0.5%,
    55% 0%, 60% 0.3%, 65% 0%, 70% 0.6%, 75% 0%, 80% 0.4%,
    85% 0%, 88% 0.2%, 92% 0%, 95% 0.5%, 98% 0%,
    100% 2%, 99.5% 5%, 100% 10%, 99.7% 15%, 100% 20%,
    99.5% 30%, 100% 40%, 99.8% 50%, 100% 60%, 99.5% 70%,
    100% 80%, 99.7% 85%, 100% 90%, 99.5% 95%, 100% 98%,
    98% 100%, 95% 99.5%, 92% 100%, 88% 99.7%, 85% 100%,
    80% 99.5%, 75% 100%, 70% 99.8%, 65% 100%, 60% 99.5%,
    55% 100%, 50% 99.7%, 45% 100%, 40% 99.5%, 35% 100%,
    30% 99.8%, 25% 100%, 20% 99.5%, 15% 100%, 10% 99.7%,
    5% 100%, 2% 99.5%, 0% 100%,
    0% 98%, 0.5% 95%, 0% 90%, 0.3% 85%, 0% 80%,
    0.5% 70%, 0% 60%, 0.2% 50%, 0% 40%, 0.5% 30%,
    0% 20%, 0.3% 15%, 0% 10%, 0.5% 5%, 0% 2%
  )`;

  return (
    <AbsoluteFill style={{
      backgroundColor: "#0a0a0a",
      justifyContent: "center",
      alignItems: "center",
      opacity: masterOpacity,
    }}>
      {/* SVG Filters (defined once, referenced by elements) */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          {/* Large-scale stains & discoloration */}
          <filter id={filterId} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="4" seed="42" result="stains" />
            <feColorMatrix in="stains" type="matrix"
              values="0.3 0 0 0 0.65
                      0 0.25 0 0 0.55
                      0 0 0.15 0 0.40
                      0 0 0 0.6 0" result="colored" />
          </filter>
          {/* Fine paper grain */}
          <filter id={filterId2} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="3" seed="7" result="grain" />
            <feColorMatrix in="grain" type="saturate" values="0" result="bwGrain" />
          </filter>
        </defs>
      </svg>

      {/* Camera Rig */}
      <div style={{
        width: "100%", height: "100%",
        display: "flex", justifyContent: "center", alignItems: "center",
        transform: `scale(${kbScale}) translate(${kbX}px, ${kbY}px)`,
      }}>
        {/* Paper Container with torn edges */}
        <div style={{
          width: 980, minHeight: 780,
          position: "relative",
          transform: `
            translateY(${interpolate(settleY, [0, 1], [600, 0])}px)
            rotate(${interpolate(settleRotation, [0, 1], [8, -1.5])}deg)
          `,
          // Torn edge shape
          clipPath: tornClip,
          // Drop shadow behind torn paper
          filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.85))",
        }}>
          {/* === BASE PAPER LAYER === */}
          <div style={{
            position: "absolute", inset: 0,
            background: `
              linear-gradient(135deg, #c9b896 0%, #d4c4a8 25%, #cbb992 50%, #d8caa5 75%, #c5b48d 100%)
            `,
          }} />

          {/* === STAIN LAYER (coffee rings, water damage) === */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {/* Coffee ring stain top-right */}
            <div style={{
              position: "absolute", top: "8%", right: "12%", width: 180, height: 180, borderRadius: "50%",
              background: "radial-gradient(ellipse, transparent 55%, rgba(120,80,30,0.25) 60%, rgba(120,80,30,0.15) 70%, transparent 75%)",
            }} />
            {/* Water damage bottom-left */}
            <div style={{
              position: "absolute", bottom: "5%", left: "3%", width: 300, height: 200,
              borderRadius: "60% 40% 50% 50%",
              background: "radial-gradient(ellipse, rgba(100,80,50,0.2) 0%, rgba(100,80,50,0.1) 40%, transparent 70%)",
            }} />
            {/* Small stain center-left */}
            <div style={{
              position: "absolute", top: "45%", left: "8%", width: 100, height: 90,
              borderRadius: "50%",
              background: "radial-gradient(ellipse, rgba(90,60,20,0.15) 0%, transparent 70%)",
            }} />
          </div>

          {/* === SVG STAIN TEXTURE (organic discoloration) === */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            opacity: 0.5, mixBlendMode: "multiply",
          }}>
            <svg width="100%" height="100%">
              <rect width="100%" height="100%" filter={`url(#${filterId})`} />
            </svg>
          </div>

          {/* === FINE GRAIN TEXTURE === */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            opacity: 0.12, mixBlendMode: "overlay",
          }}>
            <svg width="100%" height="100%">
              <rect width="100%" height="100%" filter={`url(#${filterId2})`} />
            </svg>
          </div>

          {/* === FOLD CREASES === */}
          {/* Horizontal fold */}
          <div style={{
            position: "absolute", top: "48%", left: 0, right: 0, height: 3,
            background: "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.08) 10%, rgba(0,0,0,0.12) 50%, rgba(0,0,0,0.08) 90%, transparent 100%)",
            boxShadow: "0 1px 0 rgba(255,255,255,0.15)",
          }} />
          {/* Vertical fold */}
          <div style={{
            position: "absolute", top: 0, bottom: 0, left: "52%", width: 3,
            background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.06) 10%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.06) 90%, transparent 100%)",
            boxShadow: "1px 0 0 rgba(255,255,255,0.1)",
          }} />

          {/* === ORGANIC EDGE DARKENING (radial, no square corners) === */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: `radial-gradient(ellipse 70% 65% at 50% 50%, transparent 50%, rgba(80,50,20,0.35) 85%, rgba(40,20,5,0.6) 100%)`,
            zIndex: 3,
          }} />

          {/* === CONTENT LAYER === */}
          <div style={{ position: "relative", zIndex: 4, padding: "70px 80px" }}>

            {/* Header bar */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "flex-end",
              borderBottom: "2px solid rgba(30,20,10,0.4)", paddingBottom: 16, marginBottom: 30,
            }}>
              <div style={{
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: 22, fontWeight: "bold", color: "rgba(30,20,10,0.75)",
                letterSpacing: 3, textTransform: "uppercase",
              }}>
                {title}
              </div>
              <div style={{
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: 18, color: "rgba(30,20,10,0.55)",
              }}>
                {date}
              </div>
            </div>

            {/* Reference number */}
            <div style={{
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: 16, color: "rgba(30,20,10,0.4)",
              marginBottom: 30, letterSpacing: 2,
            }}>
              {refNumber}
            </div>

            {/* Body text */}
            <div style={{
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: 28, lineHeight: 2.0,
              color: "rgba(20,15,10,0.8)",
              whiteSpace: "pre-wrap", textAlign: "left",
              letterSpacing: 0.5,
            }}>
              {renderBody()}
            </div>

            {/* Signature */}
            {signature && (
              <div style={{
                marginTop: 60, textAlign: "right",
                fontFamily: "'Brush Script MT', 'Segoe Script', cursive",
                fontSize: 44, color: "rgba(10,10,60,0.7)",
                transform: "rotate(-3deg)",
              }}>
                {signature}
              </div>
            )}
          </div>

          {/* === CLASSIFICATION STAMP === */}
          <div style={{
            position: "absolute", top: 140, right: 60, zIndex: 5,
            transform: `scale(${stampDrop}) rotate(-14deg) translateX(${stampShake}px)`,
            transformOrigin: "center center",
            opacity: interpolate(stampDrop, [0, 0.3], [0, 0.8], { extrapolateRight: "clamp" }),
          }}>
            <div style={{
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              fontSize: 42, fontWeight: 900, letterSpacing: 5,
              color: "rgba(180,20,20,0.75)", textTransform: "uppercase",
              border: "6px solid rgba(180,20,20,0.7)",
              borderRadius: 6, padding: "8px 24px",
              mixBlendMode: "multiply",
              // Slightly irregular ink via text-shadow
              textShadow: "1px 0 0 rgba(180,20,20,0.3), -1px 0 0 rgba(180,20,20,0.2)",
            }}>
              {classification}
            </div>
          </div>

        </div>{/* end paper container */}
      </div>{/* end camera rig */}

      {/* On-Screen Text */}
      <div style={{
        position: "absolute", bottom: styleGuide.layout.safeMarginPx,
        left: styleGuide.layout.safeMarginPx, right: styleGuide.layout.safeMarginPx,
        fontFamily: styleGuide.typography.fontFamilies.body,
        fontSize: `${styleGuide.typography.scale.body}px`,
        color: styleGuide.color.text,
        textAlign: "center", textShadow: "0 4px 10px rgba(0,0,0,0.8)", zIndex: 10,
      }}>
        {scene.onScreenText || ""}
      </div>
    </AbsoluteFill>
  );
};
