import { StyleGuide } from "../types/schema";

export const channelAStyleGuide: StyleGuide = {
  channelId: "doc-channel-A",
  name: "Documentary A",

  typography: {
    fontFamilies: {
      display: "Impact, sans-serif",
      body: "Arial, sans-serif",
    },
    weights: [400, 600, 800],
    scale: {
      h1: 96,
      h2: 64,
      body: 32,
      caption: 24,
    },
    tracking: {
      h1: 2,
      body: 0,
    },
  },

  color: {
    bg: "#111111",
    surface: "#222222",
    text: "#ffffff",
    textMuted: "#aaaaaa",
    primary: "#ffcc00",
    accent: "#ff0033",
    map: {
      land: "#333333",
      water: "#111111",
      border: "#555555",
      highlight: "#ffcc00",
    },
  },

  motion: {
    easings: {
      standard: [0.4, 0.0, 0.2, 1],
      emphasize: [0.2, 0.0, 0, 1],
    },
    durationsMs: {
      enter: 500,
      exit: 400,
      emphasis: 800,
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
  },

  brand: {},
};
