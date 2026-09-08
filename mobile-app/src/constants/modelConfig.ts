import { ModelConfig, DetectedObject, TrackedObject } from '../types/detection';

export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  inputWidth: 512,
  inputHeight: 512,
  classNames: ['laptop', 'finger_heart', 'scissor', 'thumbs_up', 'palm', 'fist'],
  defaultConfidenceThreshold: 0.40,
  laptopConfidenceThreshold: 0.40,
  gestureConfidenceThreshold: 0.60,
  defaultIouThreshold: 0.45,
};

export const MODEL_FILE_NAME = 'universal_detector_float16.tflite';
export const FALLBACK_MODEL_FILE_NAME = 'laptop_detector_float16.tflite';

// Distinct, high-visibility neon colors for unique laptop tracking IDs
export const TRACK_COLORS: string[] = [
  '#00F0FF', // Cyan
  '#39FF14', // Neon Lime
  '#FF5722', // Vivid Orange
  '#00E5FF', // Electric Blue
  '#E040FB', // Neon Magenta
  '#00FF85', // Mint
  '#FF3366', // Crimson Red
  '#76FF03', // Lime Accent
];

// Distinct high-contrast colors for each hand gesture
export const GESTURE_COLORS: Record<string, string> = {
  finger_heart: '#FF1493', // Deep Pink
  scissor: '#FFD700',      // Bright Gold
  thumbs_up: '#00E676',    // Emerald / Spring Green
  palm: '#2979FF',         // Electric Blue
  fist: '#FF9100',         // Amber Orange
};

export const GESTURE_EMOJIS: Record<string, string> = {
  finger_heart: '🫰 Heart',
  scissor: '✌️ Scissor',
  thumbs_up: '👍 Thumbs Up',
  palm: '👋 Palm',
  fist: '✊ Fist',
};

/**
 * Returns a deterministic high-contrast color for a given track ID
 */
export function getColorForTrackId(trackId: number): string {
  const index = (trackId - 1) % TRACK_COLORS.length;
  return TRACK_COLORS[Math.max(0, index)];
}

/**
 * Returns appropriate badge color based on class and track ID
 */
export function getColorForObject(item: DetectedObject | TrackedObject): string {
  if ('color' in item && item.color) {
    return (item as TrackedObject).color;
  }
  if (item.className === 'laptop' || item.classId === 0) {
    return TRACK_COLORS[0];
  }
  return GESTURE_COLORS[item.className] || '#00F0FF';
}

/**
 * Returns user-friendly badge title
 */
export function getLabelForObject(item: DetectedObject | TrackedObject, index: number = 0): string {
  if (item.className === 'laptop' || item.classId === 0) {
    if ('trackId' in item) {
      return `Laptop #${(item as TrackedObject).trackId}`;
    }
    return `Laptop ${index + 1}`;
  }
  return GESTURE_EMOJIS[item.className] || item.className;
}
