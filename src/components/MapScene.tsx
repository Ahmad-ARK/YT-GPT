import React, { useMemo, useEffect, useState } from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, continueRender, delayRender, staticFile } from "remotion";
import * as d3 from "d3";
import { Scene, StyleGuide } from "../types/schema";

interface MapSceneProps {
  styleGuide: StyleGuide;
  scene: Scene;
  durationMs: number;
}

/**
 * Project a point from the map's local coordinate system through the
 * full 3D transform chain + perspective to get final screen coordinates.
 *
 * The CSS transform on the map container is:
 *   scale(zoom) translateX(panX) translateY(panY) rotateX(Rdeg)
 *
 * CSS applies transforms right-to-left, so the point goes through:
 *   1. rotateX
 *   2. translateY(panY)
 *   3. translateX(panX)
 *   4. scale(zoom)
 * Then perspective projection from the parent.
 */
function projectToScreen(
  px: number, py: number, localZ: number,
  rotateXDeg: number, panX: number, panY: number, zoom: number,
  perspectivePx: number
): [number, number] {
  const cx = 1920 / 2;
  const cy = 1080 / 2;
  const rad = (rotateXDeg * Math.PI) / 180;

  // Step 1: Relative to transform origin (center of the 1920x1080 container)
  let x = px - cx;
  let y = py - cy;
  let z = localZ;

  // Step 2: rotateX (first transform applied, rightmost in CSS)
  const cosR = Math.cos(rad);
  const sinR = Math.sin(rad);
  const y1 = y * cosR - z * sinR;
  const z1 = y * sinR + z * cosR;
  x = x;         // x unchanged by rotateX
  y = y1;
  z = z1;

  // Step 3: translateY(panY)
  y += panY;

  // Step 4: translateX(panX)
  x += panX;

  // Step 5: scale(zoom)
  x *= zoom;
  y *= zoom;
  z *= zoom;

  // Step 6: Back to absolute screen coords (before perspective)
  x += cx;
  y += cy;

  // Step 7: Perspective projection from parent
  // perspective origin defaults to center of the parent element
  const scale = perspectivePx / (perspectivePx - z);
  const finalX = cx + (x - cx) * scale;
  const finalY = cy + (y - cy) * scale;

  return [finalX, finalY];
}

export const MapScene: React.FC<MapSceneProps> = ({ styleGuide, scene, durationMs }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Load GeoJSON data
  const [geoData, setGeoData] = useState<any>(null);
  const [handle] = useState(() => delayRender("Loading map data"));

  useEffect(() => {
    fetch(staticFile("world.json"))
      .then((res) => res.json())
      .then((data) => {
        setGeoData(data);
        continueRender(handle);
      })
      .catch((err) => {
        console.error("Failed to load map data", err);
      });
  }, [handle]);

  // Parse directive for locations (from LLM generator)
  const directive = JSON.parse(scene.visual.directive || "{}");
  const locations = directive.locations || directive.labels || [];
  
  // Normalize to what the component expects
  const labels = locations.map((loc: any) => ({
    name: loc.label || loc.name,
    coords: loc.coords || [loc.lng, loc.lat] // D3 projection takes [longitude, latitude]
  }));

  // Dynamically center and scale based on pins
  const projection = useMemo(() => {
    const lons = labels.map((l: any) => l.coords[0]).filter((n: number) => !isNaN(n));
    const lats = labels.map((l: any) => l.coords[1]).filter((n: number) => !isNaN(n));
    
    let centerLon = 20;
    let centerLat = 36;
    let scale = 2500; // Default zoom

    if (lons.length > 0 && lats.length > 0) {
      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      
      centerLon = (minLon + maxLon) / 2;
      centerLat = (minLat + maxLat) / 2;
      
      const lonSpread = Math.max(2, maxLon - minLon);
      const latSpread = Math.max(2, maxLat - minLat);
      const maxSpread = Math.max(lonSpread, latSpread);
      
      // Calculate a safe dynamic scale to fit all pins on screen
      scale = Math.min(3000, 40000 / maxSpread);
    }

    return d3.geoMercator()
      .center([centerLon, centerLat])
      .scale(scale)
      .translate([1920 / 2, 1080 / 2]);
  }, [labels]);

  const pathGenerator = useMemo(() => {
    return d3.geoPath().projection(projection);
  }, [projection]);

  const elevationSig = styleGuide.motion.signatures.labelElevation;
  const isElevated = elevationSig?.enabled;

  const rotateXDeg = isElevated ? elevationSig.planeRotateXDeg : 0;
  const perspectivePx = isElevated ? elevationSig.perspectivePx : 1000;
  const elevationZ = isElevated ? elevationSig.translateZ : 0;

  // Cinematic Pan and Zoom
  const totalFrames = Math.max(1, Math.floor(durationMs / 1000 * fps));
  const cameraZoom = interpolate(frame, [0, totalFrames], [0.8, 1.1]);
  const cameraPanY = interpolate(frame, [0, totalFrames], [50, -50]);
  const cameraPanX = interpolate(frame, [0, totalFrames], [20, -20]);

  // Animate map entrance
  const mapProgress = spring({
    frame,
    fps,
    config: { damping: 12 },
  });
  
  const mapOpacity = interpolate(mapProgress, [0, 1], [0, 1]);

  if (!geoData) return null;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: styleGuide.color.bg,
        perspective: `${perspectivePx}px`,
        overflow: "hidden"
      }}
    >
      {/* ============ LAYER 1: The 3D Tilted Map (SVG only) ============ */}
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          transform: `scale(${cameraZoom}) translateX(${cameraPanX}px) translateY(${cameraPanY}px) rotateX(${rotateXDeg}deg)`,
          opacity: mapOpacity,
        }}
      >
        <svg width="1920" height="1080" style={{ position: "absolute" }}>
          {geoData.features.map((feature: any, i: number) => (
            <path
              key={i}
              d={pathGenerator(feature) || ""}
              fill={styleGuide.color.map?.land || "#333"}
              stroke={styleGuide.color.map?.border || "#555"}
              strokeWidth={1.5}
            />
          ))}
        </svg>
      </div>

      {/* ============ LAYER 2: Labels as flat 2D overlay ============ */}
      {/* This div is OUTSIDE the 3D container — no CSS 3D bugs possible */}
      <div style={{ position: "absolute", width: "100%", height: "100%", pointerEvents: "none" }}>
        {labels.map((labelInfo: any, index: number) => {
          // D3 projected coordinates (flat map space)
          const [px, py] = projection(labelInfo.coords) || [1920/2, 1080/2];
          
          // Stagger label entrance
          const staggerFrames = Math.round((styleGuide.motion.signatures.staggerMs || 100) / 1000 * fps);
          const labelFrame = Math.max(0, frame - 15 - index * staggerFrames);
          
          const labelProgress = spring({
            frame: labelFrame,
            fps,
            config: { damping: 20, stiffness: 100 },
          });
          
          const currentOpacity = interpolate(labelProgress, [0, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const currentElevation = interpolate(labelProgress, [0, 1], [0, elevationZ], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

          // Project the DOT position (on map surface, z=0)
          const [dotScreenX, dotScreenY] = projectToScreen(
            px, py, 0,
            rotateXDeg, cameraPanX, cameraPanY, cameraZoom,
            perspectivePx
          );

          // Project the LABEL position (elevated above map surface)
          const [labelScreenX, labelScreenY] = projectToScreen(
            px, py, currentElevation,
            rotateXDeg, cameraPanX, cameraPanY, cameraZoom,
            perspectivePx
          );

          // Apply map entrance opacity
          const finalOpacity = currentOpacity * mapOpacity;

          return (
            <React.Fragment key={labelInfo.name}>
              {/* Red dot on the map surface */}
              <div
                style={{
                  position: "absolute",
                  left: dotScreenX,
                  top: dotScreenY,
                  width: 12,
                  height: 12,
                  backgroundColor: styleGuide.color.accent,
                  borderRadius: "50%",
                  transform: "translate(-50%, -50%)",
                  opacity: finalOpacity,
                  boxShadow: "0 0 10px rgba(0,0,0,0.8)",
                }}
              />

              {/* Connecting line from dot to label */}
              <svg
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: 1920,
                  height: 1080,
                  pointerEvents: "none",
                }}
              >
                <line
                  x1={dotScreenX}
                  y1={dotScreenY}
                  x2={labelScreenX}
                  y2={labelScreenY}
                  stroke={styleGuide.color.primary}
                  strokeWidth={3}
                  opacity={finalOpacity}
                />
              </svg>

              {/* Label text — always flat, always readable */}
              <div
                style={{
                  position: "absolute",
                  left: labelScreenX,
                  top: labelScreenY,
                  transform: "translate(-50%, -100%)",  // Center horizontally, sit above the line endpoint
                  opacity: finalOpacity,
                  fontFamily: styleGuide.typography.fontFamilies.display,
                  fontSize: `${styleGuide.typography.scale.caption}px`,
                  color: styleGuide.color.text,
                  backgroundColor: styleGuide.color.surface,
                  padding: "8px 16px",
                  border: `3px solid ${styleGuide.color.primary}`,
                  borderRadius: "8px",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                  whiteSpace: "nowrap",
                }}
              >
                {labelInfo.name}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* ============ LAYER 3: Narrative Text ============ */}
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
