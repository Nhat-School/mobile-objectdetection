import { BoundingBox, DetectedObject, NormalizedBox } from '../types/detection';

/**
 * Calculates the Intersection over Union (IoU) between two bounding boxes.
 */
export function calculateIoU(boxA: BoundingBox, boxB: BoundingBox): number {
  const xA = Math.max(boxA.x, boxB.x);
  const yA = Math.max(boxA.y, boxB.y);
  const xB = Math.min(boxA.x + boxA.width, boxB.x + boxB.width);
  const yB = Math.min(boxA.y + boxA.height, boxB.y + boxB.height);

  const intersectionWidth = Math.max(0, xB - xA);
  const intersectionHeight = Math.max(0, yB - yA);
  const intersectionArea = intersectionWidth * intersectionHeight;

  const boxAArea = boxA.width * boxA.height;
  const boxBArea = boxB.width * boxB.height;

  const unionArea = boxAArea + boxBArea - intersectionArea;
  if (unionArea <= 0) return 0;

  return intersectionArea / unionArea;
}

/**
 * Applies Non-Maximum Suppression (NMS) to eliminate redundant, overlapping detections.
 */
export function applyNMS(
  candidates: DetectedObject[],
  iouThreshold: number
): DetectedObject[] {
  // Sort candidates by confidence score in descending order
  const sorted = [...candidates].sort((a, b) => b.confidence - a.confidence);
  const selected: DetectedObject[] = [];

  while (sorted.length > 0) {
    const current = sorted.shift()!;
    selected.push(current);

    // Keep candidates that have an IoU lower than the threshold with the current box
    for (let i = sorted.length - 1; i >= 0; i--) {
      const iou = calculateIoU(current.box, sorted[i].box);
      if (iou > iouThreshold) {
        sorted.splice(i, 1);
      }
    }
  }

  return selected;
}

/**
 * Parses raw YOLO output tensor (Float32Array) into candidate DetectedObjects.
 *
 * Supports both standard YOLO shape [1, 4 + C, N] (where N=8400 for 640x640)
 * and transposed format [1, N, 4 + C].
 *
 * @param rawOutput Flattened Float32Array from model inference
 * @param numClasses Number of classes (1 for 'laptop')
 * @param modelWidth Model input width (e.g. 640)
 * @param modelHeight Model input height (e.g. 640)
 * @param viewWidth Target display width in pixels
 * @param viewHeight Target display height in pixels
 * @param confThreshold Minimum confidence threshold
 * @param iouThreshold NMS overlap threshold
 */
export function decodeYoloOutput(
  rawOutput: Float32Array | number[],
  numClasses: number = 1,
  modelWidth: number = 640,
  modelHeight: number = 640,
  viewWidth: number = 360,
  viewHeight: number = 640,
  confThreshold: number = 0.45,
  iouThreshold: number = 0.45
): DetectedObject[] {
  const totalElements = rawOutput.length;
  const numChannels = 4 + numClasses;
  const numBoxes = Math.floor(totalElements / numChannels);

  if (numBoxes === 0) return [];

  const candidates: DetectedObject[] = [];
  const scaleX = viewWidth / modelWidth;
  const scaleY = viewHeight / modelHeight;

  // Determine tensor orientation:
  // Format A (Ultralytics default): [channels, numBoxes] -> rawOutput[c * numBoxes + i]
  // Format B (Transposed): [numBoxes, channels] -> rawOutput[i * numChannels + c]
  const isChannelsFirst = totalElements === numChannels * numBoxes;

  for (let i = 0; i < numBoxes; i++) {
    let cx: number, cy: number, w: number, h: number, maxScore: number = 0, bestClass: number = 0;

    if (isChannelsFirst) {
      cx = rawOutput[0 * numBoxes + i];
      cy = rawOutput[1 * numBoxes + i];
      w = rawOutput[2 * numBoxes + i];
      h = rawOutput[3 * numBoxes + i];

      for (let c = 0; c < numClasses; c++) {
        const score = rawOutput[(4 + c) * numBoxes + i];
        if (score > maxScore) {
          maxScore = score;
          bestClass = c;
        }
      }
    } else {
      const offset = i * numChannels;
      cx = rawOutput[offset + 0];
      cy = rawOutput[offset + 1];
      w = rawOutput[offset + 2];
      h = rawOutput[offset + 3];

      for (let c = 0; c < numClasses; c++) {
        const score = rawOutput[offset + 4 + c];
        if (score > maxScore) {
          maxScore = score;
          bestClass = c;
        }
      }
    }

    // Filter by confidence threshold
    if (maxScore >= confThreshold) {
      // Convert center-x, center-y, width, height to top-left x, y
      const x1 = Math.max(0, cx - w / 2);
      const y1 = Math.max(0, cy - h / 2);
      const x2 = Math.min(modelWidth, cx + w / 2);
      const y2 = Math.min(modelHeight, cy + h / 2);

      const boxWidth = Math.max(1, x2 - x1);
      const boxHeight = Math.max(1, y2 - y1);

      // Normalization to [0, 1]
      const normalizedBox: NormalizedBox = {
        x1: x1 / modelWidth,
        y1: y1 / modelHeight,
        x2: x2 / modelWidth,
        y2: y2 / modelHeight,
      };

      // Screen view coordinates
      const box: BoundingBox = {
        x: Math.round(x1 * scaleX),
        y: Math.round(y1 * scaleY),
        width: Math.round(boxWidth * scaleX),
        height: Math.round(boxHeight * scaleY),
      };

      candidates.push({
        id: `det_${i}_${Date.now()}`,
        box,
        normalizedBox,
        confidence: maxScore,
        classId: bestClass,
        className: 'laptop',
      });
    }
  }

  // Apply Non-Maximum Suppression to remove duplicates
  return applyNMS(candidates, iouThreshold);
}
