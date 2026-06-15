import React, { useMemo, useEffect, useState } from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, continueRender, delayRender, staticFile } from "remotion";
import * as d3 from "d3";
import { Scene, StyleGuide } from "../types/schema";
import { getTriggerFrame } from "../utils/timing";

interface GlobeSceneProps {
  styleGuide: StyleGuide;
  scene: Scene;
  durationMs: number;
}

export const GlobeScene: React.FC<GlobeSceneProps> = ({ styleGuide, scene, durationMs }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const [geoData, setGeoData] = useState<any>(null);
  const [handle] = useState(() => delayRender("Loading map data"));

  useEffect(() => {
    fetch(staticFile("world.json"))
      .then((res) => res.json())
      .then((data) => {
        setGeoData(data);
        continueRender(handle);
      })
      .catch((err) => console.error("Failed to load map data", err));
  }, [handle]);

  const directive = JSON.parse(scene.visual.directive || "{}");
  const locations = directive.locations || [];
  
  const totalFrames = Math.max(1, Math.floor(durationMs / 1000 * fps));

  // Determine Rotation: The globe spins over time
  // D3 rotation is [-yaw, -pitch, roll]
  const startRot = directive.startRotation || [0, -20, 0];
  const endRot = directive.endRotation || [-90, -20, 0];
  
  const currentYaw = interpolate(frame, [0, totalFrames], [startRot[0], endRot[0]]);
  const currentPitch = interpolate(frame, [0, totalFrames], [startRot[1], endRot[1]]);
  
  const projection = useMemo(() => {
    return d3.geoOrthographic()
      .scale(450) // Scale to fit screen
      .translate([1920 / 2, 1080 / 2])
      .rotate([currentYaw, currentPitch, 0])
      .clipAngle(90); // Clips back side for polygons
  }, [currentYaw, currentPitch]);

  const pathGenerator = useMemo(() => {
    return d3.geoPath().projection(projection);
  }, [projection]);

  if (!geoData) return null;

  return (
    <AbsoluteFill style={{ backgroundColor: styleGuide.color.bg, justifyContent: "center", alignItems: "center" }}>
      {/* Glow behind globe */}
      <div style={{ position: "absolute", width: "900px", height: "900px", background: `radial-gradient(circle, ${styleGuide.color.primary}33 0%, transparent 70%)`, borderRadius: "50%", pointerEvents: "none" }} />
      
      <svg width="1920" height="1080" style={{ position: "absolute", overflow: "visible" }}>
        {/* The Ocean Sphere */}
        <path
          d={pathGenerator({type: "Sphere"} as any) || ""}
          fill="#1a202c" // dark blue ocean
          stroke="#2d3748"
          strokeWidth="2"
        />
        
        {/* Graticule (Grid lines) */}
        <path
          d={pathGenerator(d3.geoGraticule10()) || ""}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="1"
        />

        {/* Landmasses */}
        {geoData.features.map((feature: any, i: number) => (
          <path
            key={i}
            d={pathGenerator(feature) || ""}
            fill={styleGuide.color.map?.land || "#333"}
            stroke={styleGuide.color.map?.border || "#555"}
            strokeWidth={1}
          />
        ))}

        {/* Dynamic Curved Connections (flight paths/routes) */}
        {directive.connections?.map((conn: any, i: number) => {
          const triggerFrame = getTriggerFrame(scene.narration, conn.triggerWord, totalFrames, i * 30);
          // If frame < triggerFrame, progress = 0
          const progress = spring({ frame: Math.max(0, frame - triggerFrame), fps, config: { damping: 40, stiffness: 60 } });
          if (progress === 0) return null;

          // Instead of stroke-dasharray (which fails with unknown path lengths),
          // we use d3.geoInterpolate to find the exact point along the arc at `progress` %
          const interpolateCoords = d3.geoInterpolate(conn.from, conn.to);
          
          // Generate a dense set of coordinates along the arc up to the current progress
          const numSegments = Math.max(2, Math.floor(progress * 50));
          const arcCoords = Array.from({ length: numSegments }, (_, idx) => {
            const t = idx / (numSegments - 1) * progress;
            return interpolateCoords(t);
          });

          const lineGeoJSON = { type: "LineString", coordinates: arcCoords };
          const d = pathGenerator(lineGeoJSON as any) || "";
          
          return (
             <path
               key={`conn-${i}`}
               d={d}
               fill="none"
               stroke={styleGuide.color.accent}
               strokeWidth="4"
               opacity="0.8"
             />
          );
        })}
      </svg>

      {/* Markers / Pins */}
      <div style={{ position: "absolute", width: "100%", height: "100%", pointerEvents: "none" }}>
        {locations.map((loc: any, idx: number) => {
          const triggerFrame = getTriggerFrame(scene.narration, loc.triggerWord, totalFrames, idx * 30);
          const progress = spring({ frame: Math.max(0, frame - triggerFrame), fps, config: { damping: 12 } });

          // Project coordinate
          const [lon, lat] = loc.coords || [loc.lng, loc.lat];
          const projected = projection([lon, lat]);
          if (!projected) return null;
          const [px, py] = projected;
          
          // Check if it's on the front of the globe
          // D3 rotates the GLOBE by [-yaw, -pitch], which means the center of projection is [-currentYaw, -currentPitch].
          const distance = d3.geoDistance([lon, lat], [-currentYaw, -currentPitch]);
          const isVisible = distance < Math.PI / 2;

          if (!isVisible || progress === 0) return null;

          return (
            <div key={idx} style={{
              position: "absolute",
              left: px,
              top: py,
              transform: `translate(-50%, -100%) scale(${progress})`,
              opacity: interpolate(progress, [0, 1], [0, 1]),
            }}>
              {/* Pin */}
              <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "12px", height: "12px", borderRadius: "50%", backgroundColor: styleGuide.color.primary, border: "2px solid #fff", boxShadow: "0 0 10px rgba(0,0,0,0.5)" }} />
              {/* Label */}
              <div style={{
                position: "absolute",
                bottom: "15px",
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: styleGuide.color.surface,
                color: styleGuide.color.text,
                padding: "6px 12px",
                borderRadius: "4px",
                border: `2px solid ${styleGuide.color.primary}`,
                fontFamily: styleGuide.typography.fontFamilies.display,
                fontSize: "24px",
                whiteSpace: "nowrap",
                boxShadow: "0 10px 20px rgba(0,0,0,0.5)"
              }}>
                {loc.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* On-Screen Text */}
      <div style={{ position: "absolute", bottom: styleGuide.layout.safeMarginPx, left: styleGuide.layout.safeMarginPx, right: styleGuide.layout.safeMarginPx, fontFamily: styleGuide.typography.fontFamilies.body, fontSize: `${styleGuide.typography.scale.body}px`, color: styleGuide.color.text, textAlign: "center", textShadow: "0 4px 10px rgba(0,0,0,0.8)", zIndex: 10 }}>{scene.onScreenText || ""}</div>
    </AbsoluteFill>
  );
};
