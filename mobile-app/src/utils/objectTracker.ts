import { BoundingBox, DetectedObject, TrackedObject, TrackingStats } from '../types/detection';
import { calculateIoU } from './yoloPostProcess';
import { getColorForTrackId } from '../constants/modelConfig';

export interface TrackerOptions {
  /** Minimum IoU overlap to associate a detection with an existing track */
  iouThreshold?: number;
  /** Maximum pixel distance between centroids to allow association if IoU is zero (e.g. fast camera pan) */
  maxCentroidDistance?: number;
  /** Maximum consecutive frames a track can disappear before being removed from active view */
  maxDisappearedFrames?: number;
}

/**
 * Calculates Euclidean distance between two 2D points.
 */
function euclideanDistance(p1: [number, number], p2: [number, number]): number {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Computes the center [cx, cy] of a bounding box.
 */
function getBoxCentroid(box: BoundingBox): [number, number] {
  return [box.x + box.width / 2, box.y + box.height / 2];
}

/**
 * Real-time Multi-Object Tracker for Video & Live Camera.
 * Assigns persistent unique IDs (e.g. Laptop #1, Laptop #2)
 * to prevent double-counting or overcounting the same laptop across frames.
 */
export class ObjectTracker {
  private nextTrackId: number = 1;
  private activeTracks: Map<number, TrackedObject> = new Map();
  private allCountedTrackIds: Set<number> = new Set();

  private iouThreshold: number;
  private maxCentroidDistance: number;
  private maxDisappearedFrames: number;

  constructor(options: TrackerOptions = {}) {
    this.iouThreshold = options.iouThreshold ?? 0.25;
    this.maxCentroidDistance = options.maxCentroidDistance ?? 120; // 120 pixels threshold
    this.maxDisappearedFrames = options.maxDisappearedFrames ?? 18; // ~1-1.2 seconds at 15 FPS
  }

  /**
   * Resets the tracking session and all counters.
   */
  public reset(): void {
    this.nextTrackId = 1;
    this.activeTracks.clear();
    this.allCountedTrackIds.clear();
  }

  /**
   * Updates object tracks with new detections from the current frame.
   *
   * @param detections List of laptops detected in the current frame
   * @returns List of active tracked objects with persistent unique IDs
   */
  public update(detections: DetectedObject[]): TrackedObject[] {
    const activeTrackList = Array.from(this.activeTracks.values());
    const matchedDetectionIndices = new Set<number>();
    const matchedTrackIds = new Set<number>();

    // Step 1: Match detections with existing active tracks
    if (activeTrackList.length > 0 && detections.length > 0) {
      // Build similarity matrix using combined IoU and centroid distance
      const matches: { trackId: number; detIndex: number; score: number }[] = [];

      for (const track of activeTrackList) {
        for (let j = 0; j < detections.length; j++) {
          const det = detections[j];
          const iou = calculateIoU(track.box, det.box);
          const detCentroid = getBoxCentroid(det.box);
          const dist = euclideanDistance(track.centroid, detCentroid);

          // Diagonal of track box as normalized distance reference
          const boxDiagonal = Math.sqrt(track.box.width ** 2 + track.box.height ** 2);
          const isCentroidClose = dist < Math.max(this.maxCentroidDistance, boxDiagonal * 0.4);

          if (iou >= this.iouThreshold || (iou > 0.05 && isCentroidClose)) {
            // Combined similarity score: IoU heavily weighted + spatial proximity
            const score = iou + Math.max(0, 1 - dist / (boxDiagonal || 1)) * 0.2;
            matches.push({ trackId: track.trackId, detIndex: j, score });
          }
        }
      }

      // Sort matches by highest score first (greedy association)
      matches.sort((a, b) => b.score - a.score);

      for (const match of matches) {
        if (!matchedTrackIds.has(match.trackId) && !matchedDetectionIndices.has(match.detIndex)) {
          matchedTrackIds.add(match.trackId);
          matchedDetectionIndices.add(match.detIndex);

          // Update existing track
          const existingTrack = this.activeTracks.get(match.trackId)!;
          const det = detections[match.detIndex];
          const newCentroid = getBoxCentroid(det.box);

          // Smooth coordinate updates (linear blend to eliminate bounding box flicker)
          const alpha = 0.75;
          const smoothedBox: BoundingBox = {
            x: Math.round(existingTrack.box.x * (1 - alpha) + det.box.x * alpha),
            y: Math.round(existingTrack.box.y * (1 - alpha) + det.box.y * alpha),
            width: Math.round(existingTrack.box.width * (1 - alpha) + det.box.width * alpha),
            height: Math.round(existingTrack.box.height * (1 - alpha) + det.box.height * alpha),
          };

          this.activeTracks.set(match.trackId, {
            ...existingTrack,
            box: smoothedBox,
            normalizedBox: det.normalizedBox,
            confidence: det.confidence,
            centroid: newCentroid,
            hits: existingTrack.hits + 1,
            disappearedFrames: 0,
          });
        }
      }
    }

    // Step 2: Handle unmatched detections -> create new unique tracks
    for (let j = 0; j < detections.length; j++) {
      if (!matchedDetectionIndices.has(j)) {
        const det = detections[j];
        const newTrackId = this.nextTrackId++;
        const centroid = getBoxCentroid(det.box);
        const color = getColorForTrackId(newTrackId);

        const newTrack: TrackedObject = {
          ...det,
          trackId: newTrackId,
          centroid,
          hits: 1,
          disappearedFrames: 0,
          color,
          firstSeenTimestamp: Date.now(),
        };

        this.activeTracks.set(newTrackId, newTrack);
        this.allCountedTrackIds.add(newTrackId);
      }
    }

    // Step 3: Handle unmatched active tracks -> increment disappeared counter or retire
    for (const track of activeTrackList) {
      if (!matchedTrackIds.has(track.trackId)) {
        const currentDisappeared = track.disappearedFrames + 1;
        if (currentDisappeared > this.maxDisappearedFrames) {
          // Remove from active view, but ID remains in allCountedTrackIds
          this.activeTracks.delete(track.trackId);
        } else {
          this.activeTracks.set(track.trackId, {
            ...track,
            disappearedFrames: currentDisappeared,
          });
        }
      }
    }

    // Return currently active visible tracks (only those visible in current frame)
    return Array.from(this.activeTracks.values()).filter((t) => t.disappearedFrames === 0);
  }

  /**
   * Returns current tracking statistics:
   * - currentlyInView: number of laptops visible right now
   * - totalUniqueCounted: cumulative unique laptops seen (no double counting)
   */
  public getStats(): TrackingStats {
    const currentlyInView = Array.from(this.activeTracks.values()).filter(
      (t) => t.disappearedFrames === 0
    ).length;

    return {
      currentlyInView,
      totalUniqueCounted: this.allCountedTrackIds.size,
      activeTrackIds: Array.from(this.activeTracks.keys()),
    };
  }
}
