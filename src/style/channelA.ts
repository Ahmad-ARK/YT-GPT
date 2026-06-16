import { loadFont as loadDisplay } from "@remotion/google-fonts/Archivo";
import { loadFont as loadBody } from "@remotion/google-fonts/Inter";
import { StyleGuide } from "../types/schema";

const display = loadDisplay();
const body = loadBody();

export const channelAStyleGuide: StyleGuide = {
  channelId: "doc-channel-A",
  name: "Documentary A",

  typography: {
    fontFamilies: {
      display: display.fontFamily,
      body: body.fontFamily,
    },
    weights: [400, 500, 600, 700, 800],
    scale: {
      display: 120,
      h1: 96,
      h2: 64,
      h3: 48,
      body: 32,
      caption: 24,
      kicker: 28,
    },
    tracking: {
      display: 2,
      h1: 1,
      h2: 0.5,
      h3: 0,
      body: 0,
      caption: 0,
      kicker: 4,
    },
  },

  color: {
    bg: "#0E0F13",
    surface: "#1A1C22",
    text: "#F2F2F0",
    textMuted: "#9AA0A6",
    primary: "#E8B44A", // Muted gold
    accent: "#D84B4B", // Muted red for very rare emphasis
    map: {
      land: "#23262E",
      water: "#0E0F13",
      border: "#3A3F49",
      highlight: "#E8B44A",
    },
    chart: [
      "#E8B44A", // primary gold
      "#4A90E2", // muted blue
      "#50E3C2", // muted teal
      "#F5A623", // orange
      "#D0021B", // red
    ]
  },

  chapterPalettes: [
    { bg: "#0E0F13", surface: "#1A1C22", primary: "#E8B44A", accent: "#D84B4B" }, // Base: Gold/Steel
    { bg: "#0D1317", surface: "#151F26", primary: "#50E3C2", accent: "#E8B44A" }, // Chapter 2: Deep Teal/Gold
    { bg: "#171212", surface: "#241919", primary: "#D84B4B", accent: "#E8B44A" }, // Chapter 3: Muted Crimson
  ],

  motion: {
    easings: {
      standard: [0.4, 0.0, 0.2, 1],
      enter: [0.0, 0.0, 0.2, 1],
      exit: [0.4, 0.0, 1, 1],
      emphasize: [0.2, 0.0, 0, 1],
      cameraDrift: [0.25, 0.1, 0.25, 1],
    },
    durationsMs: {
      enter: 600,
      exit: 400,
      emphasis: 800,
      cameraDrift: 3000,
    },
    signatures: {
      labelElevation: {
        enabled: true,
        planeRotateXDeg: 60,
        labelCounterRotate: true,
        translateZ: 100,
        perspectivePx: 1000,
      },
      staggerMs: 100,
    },
  },

  layout: {
    safeMarginPx: 60,
    options: ["centered", "lowerThird", "fullBleed", "splitLeft", "splitRight"],
  },

  brand: {
    transitionStyle: "cross-dissolve"
  },
};
