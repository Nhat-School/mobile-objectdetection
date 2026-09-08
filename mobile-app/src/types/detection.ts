export type AppDomainMode = 'laptop' | 'gesture';
export type DetectionMode = 'photo' | 'live';
export type GestureClass = 'finger_heart' | 'scissor' | 'thumbs_up' | 'palm' | 'fist' | 'none';

export interface BoundingBox {
  /** Top-left X coordinate in view space (pixels) */
  x: number;
  /** Top-left Y coordinate in view space (pixels) */
  y: number;
  /** Box width in view space (pixels) */
  width: number;
  /** Box height in view space (pixels) */
  height: number;
}

export interface NormalizedBox {
  /** Normalized top-left X [0, 1] */
  x1: number;
  /** Normalized top-left Y [0, 1] */
  y1: number;
  /** Normalized bottom-right X [0, 1] */
  x2: number;
  /** Normalized bottom-right Y [0, 1] */
  y2: number;
}

export interface DetectedObject {
  /** Unique index of the detection within the current frame */
  id: string;
  /** Pixel bounding box fitted to display view */
  box: BoundingBox;
  /** Normalized bounding box [0, 1] */
  normalizedBox: NormalizedBox;
  /** Detection confidence score [0.0 - 1.0] */
  confidence: number;
  /** Class ID (0 for laptop) */
  classId: number;
  /** Human-readable class name */
  className: string;
}

export interface TrackedObject extends DetectedObject {
  /** Persistent unique tracker ID (e.g. 1, 2, 3...) */
  trackId: number;
  /** Centroid coordinates [cx, cy] in view space */
  centroid: [number, number];
  /** How many consecutive frames this object was matched */
  hits: number;
  /** Number of consecutive frames missed */
  disappearedFrames: number;
  /** Color hex code assigned to this track */
  color: string;
  /** Timestamp when first detected */
  firstSeenTimestamp: number;
}

export interface TrackingStats {
  /** Currently visible laptops in the camera view */
  currentlyInView: number;
  /** Total unique laptops counted during this session without duplicate counting */
  totalUniqueCounted: number;
  /** Active unique track IDs present */
  activeTrackIds: number[];
}

export interface GestureDetectionResult {
  gesture: GestureClass;
  confidence: number;
  box?: BoundingBox;
  isTriggered: boolean;
  cooldownRemainingMs: number;
  totalTriggerCount: number;
}

export interface InferenceMetrics {
  /** Model inference duration in milliseconds */
  inferenceTimeMs: number;
  /** Estimated frame rate of the detector */
  fps: number;
}

export interface ModelConfig {
  inputWidth: number;
  inputHeight: number;
  classNames: string[];
  defaultConfidenceThreshold: number;
  defaultIouThreshold: number;
}
