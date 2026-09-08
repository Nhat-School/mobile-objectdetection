import { ModelConfig } from '../types/detection';

export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  inputWidth: 640,
  inputHeight: 640,
  classNames: ['laptop'],
  defaultConfidenceThreshold: 0.45,
  defaultIouThreshold: 0.45,
};

export const MODEL_FILE_NAME = 'laptop_detector_float16.tflite';

// Distinct, high-visibility neon colors for unique laptop tracking IDs
export const TRACK_COLORS: string[] = [
  '#00F0FF', // Cyan
  '#39FF14', // Neon Green
  '#FF5722', // Deep Orange
  '#FF007F', // Neon Pink / Magenta
  '#FFD700', // Bright Gold / Yellow
  '#7B2CBF', // Deep Purple
  '#00E5FF', // Electric Blue
  '#FF3366', // Crimson Red
  '#00FF85', // Mint Green
  '#FF9100', // Amber
];

/**
 * Returns a deterministic high-contrast color for a given track ID
 */
export function getColorForTrackId(trackId: number): string {
  const index = (trackId - 1) % TRACK_COLORS.length;
  return TRACK_COLORS[Math.max(0, index)];
}
