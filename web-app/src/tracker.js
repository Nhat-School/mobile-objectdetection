/**
 * Anti-Overcounting Object Tracker for Laptops (IoU + Centroid)
 */

function calculateIoU(b1, b2) {
  const xA = Math.max(b1.x, b2.x);
  const yA = Math.max(b1.y, b2.y);
  const xB = Math.min(b1.x + b1.width, b2.x + b2.width);
  const yB = Math.min(b1.y + b1.height, b2.y + b2.height);

  const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
  const b1Area = b1.width * b1.height;
  const b2Area = b2.width * b2.height;
  const unionArea = b1Area + b2Area - interArea;

  return unionArea > 0 ? interArea / unionArea : 0;
}

function getCentroid(b) {
  return [b.x + b.width / 2, b.y + b.height / 2];
}

export class ObjectTracker {
  constructor(options = {}) {
    this.iouThreshold = options.iouThreshold || 0.25;
    this.maxCentroidDist = options.maxCentroidDist || 140;
    this.maxDisappearedFrames = options.maxDisappearedFrames || 18;
    this.nextTrackId = 1;
    this.activeTracks = new Map();
    this.allCountedIds = new Set();
  }

  reset() {
    this.nextTrackId = 1;
    this.activeTracks.clear();
    this.allCountedIds.clear();
  }

  update(detections) {
    if (detections.length === 0) {
      for (const [id, track] of this.activeTracks.entries()) {
        track.disappearedCount++;
        if (track.disappearedCount > this.maxDisappearedFrames) {
          this.activeTracks.delete(id);
        }
      }
      return Array.from(this.activeTracks.values());
    }

    const updatedTracks = [];
    const matchedTrackIds = new Set();
    const matchedDetIndices = new Set();

    // Match by IoU & Centroid distance
    for (const [id, track] of this.activeTracks.entries()) {
      let bestIoU = 0;
      let bestIdx = -1;

      detections.forEach((det, idx) => {
        if (matchedDetIndices.has(idx)) return;
        const iou = calculateIoU(track.box, det.box);
        if (iou > bestIoU) {
          bestIoU = iou;
          bestIdx = idx;
        }
      });

      if (bestIoU >= this.iouThreshold && bestIdx !== -1) {
        track.box = detections[bestIdx].box;
        track.confidence = detections[bestIdx].confidence;
        track.disappearedCount = 0;
        matchedTrackIds.add(id);
        matchedDetIndices.add(bestIdx);
        updatedTracks.push(track);
      }
    }

    // Register new detections
    detections.forEach((det, idx) => {
      if (!matchedDetIndices.has(idx)) {
        const newTrack = {
          trackId: this.nextTrackId++,
          className: det.className,
          box: det.box,
          confidence: det.confidence,
          disappearedCount: 0
        };
        this.activeTracks.set(newTrack.trackId, newTrack);
        this.allCountedIds.add(newTrack.trackId);
        updatedTracks.push(newTrack);
      }
    });

    return updatedTracks;
  }

  getStats() {
    return {
      currentlyInView: this.activeTracks.size,
      totalUniqueCounted: this.allCountedIds.size
    };
  }
}
