export type SourcedFact = { claim: string; sourceUrl: string; sourceTitle?: string };

export type ResearchOutput = {
  topic: string;
  thesis: string;
  timeline: SourcedFact[];
  people: SourcedFact[];
  events: SourcedFact[];
  facts: SourcedFact[];
};

export type VisualType =
  | "titleCard" | "timeline" | "map" | "chart" | "stat"
  | "comparison" | "quoteCard" | "archivalPhoto" | "newspaper"
  | "document" | "globe" | "archiveMontage" | "countdown"
  | "infographic" | "ranking" | "cinematicPhoto"
  | "genImage" | "genVideo" | "hyperframeClip";

export type Asset = {
  ref: string;
  kind: "image" | "video" | "lottie" | "svg" | "mp4";
  source: "wikimedia" | "pexels" | "storyblocks" | "envato"
        | "kling" | "veo" | "imageModel" | "hyperframes" | "generated";
  license: {
    type: string;
    attributionRequired: boolean;
    attributionText?: string;
  };
};

export type VisualEntry = {
  type: VisualType;
  directive: string;
  style?: Record<string, unknown>;
  assets?: Asset[];
  weight?: number; // Relative duration weight (default: 1)
};

export type Scene = {
  id: string;
  narration: string;
  onScreenText?: string;
  visual: VisualEntry;          // Legacy single visual (still supported)
  visuals?: VisualEntry[];      // New: array of visuals for multi-cut segments
  sources: SourcedFact[];
  durationMs?: number;
  audioFilename?: string;
  audioRef?: string;
  wordTimings?: { word: string; startMs: number; endMs: number }[];
  sfx?: string;
};

export type Storyboard = {
  id: string;
  channelId: string;
  topic: string;
  thesis: string;
  scenes: Scene[];
  status: "draft" | "script_approved" | "rendered" | "final_approved" | "uploaded";
  bgMusic?: string;
};

export type StyleGuide = {
  channelId: string;
  name: string;

  typography: {
    fontFamilies: { display: string; body: string; mono?: string };
    weights: number[];
    scale: Record<string, number>;
    tracking: Record<string, number>;
  };

  color: {
    bg: string; surface: string;
    text: string; textMuted: string;
    primary: string; accent: string;
    map?: { land: string; water: string; border: string; highlight: string };
    chart?: string[];
  };

  motion: {
    easings: Record<string, [number, number, number, number]>;
    durationsMs: Record<string, number>;
    signatures: {
      labelElevation?: {
        enabled: boolean;
        planeRotateXDeg: number;
        labelCounterRotate: boolean;
        translateZ: number;
        perspectivePx: number;
      };
      staggerMs?: number;
    };
  };

  layout: {
    safeMarginPx: number;
    grid?: { columns: number; gutterPx: number };
    options: ("centered" | "lowerThird" | "fullBleed" | "splitLeft" | "splitRight")[];
  };

  chapterPalettes?: {
    bg: string;
    surface: string;
    primary: string;
    accent: string;
  }[];

  audio?: { musicBed?: string; sfxPack?: string };

  brand: { logoRef?: string; lowerThirdStyle?: string; transitionStyle?: string };
};
