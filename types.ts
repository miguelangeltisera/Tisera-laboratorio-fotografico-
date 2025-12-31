
export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

export interface ImageState {
  original: string | null;
  enhanced: string | null;
  mimeType: string | null;
}

export interface EnhancementHistory {
  id: string;
  original: string;
  enhanced: string;
  prompt: string;
  timestamp: number;
}

export interface EnhancementConfig {
  aspectRatio: AspectRatio;
  mode: 'standard' | 'restore' | 'resize' | 'artistic';
}
