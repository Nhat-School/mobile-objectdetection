/**
 * High-Accuracy Geometric Gesture Classifier for Google MediaPipe Hands (21 3D Landmarks)
 */

export const GESTURE_INFO = {
  none: { label: 'None', emoji: '—', color: '#8B949E' },
  finger_heart: { label: 'Finger Heart', emoji: '🫰 Heart', color: '#FF1493', action: 'Love sent! Double haptic' },
  scissor: { label: 'Scissor / Peace', emoji: '✌️ Scissor', color: '#FFD700', action: 'Victory confirmed!' },
  thumbs_up: { label: 'Thumbs Up', emoji: '👍 Thumbs Up', color: '#00E676', action: 'Success! Confirmed' },
  thumbs_down: { label: 'Thumbs Down', emoji: '👎 Thumbs Down', color: '#FF3D00', action: 'Dislike / Down detected!' },
  palm: { label: 'Open Palm / Wave', emoji: '👋 Palm', color: '#2979FF', action: 'Hello! Wave detected' },
  fist: { label: 'Fist / Rock', emoji: '✊ Fist', color: '#FF9100', action: 'Power fist triggered!' }
};

export function euclideanDist(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Checks if a finger is extended relative to palm/wrist
 */
function isFingerExtended(landmarks, tipIdx, pipIdx, mcpIdx) {
  const wrist = landmarks[0];
  const tipDist = euclideanDist(landmarks[tipIdx], wrist);
  const pipDist = euclideanDist(landmarks[pipIdx], wrist);
  return tipDist > pipDist * 1.05;
}

/**
 * Classifies 21 MediaPipe landmarks into one of our 5 target gesture classes
 */
export function classifyHandGesture(landmarks) {
  if (!landmarks || landmarks.length < 21) {
    return { gesture: 'none', confidence: 0 };
  }

  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const thumbIp = landmarks[3];
  const thumbMcp = landmarks[2];

  const indexTip = landmarks[8];
  const indexDip = landmarks[7];
  const indexPip = landmarks[6];
  const indexMcp = landmarks[5];

  const middleTip = landmarks[12];
  const middlePip = landmarks[10];
  const middleMcp = landmarks[9];

  const ringTip = landmarks[16];
  const ringPip = landmarks[14];
  const ringMcp = landmarks[13];

  const pinkyTip = landmarks[20];
  const pinkyPip = landmarks[18];
  const pinkyMcp = landmarks[17];

  // Palm scale reference (wrist to middle knuckle)
  const palmScale = Math.max(0.08, euclideanDist(wrist, middleMcp));

  // Finger extension flags
  const indexOpen = isFingerExtended(landmarks, 8, 6, 5);
  const middleOpen = isFingerExtended(landmarks, 12, 10, 9);
  const ringOpen = isFingerExtended(landmarks, 16, 14, 13);
  const pinkyOpen = isFingerExtended(landmarks, 20, 18, 17);

  // Check if index finger is curled into the palm (like middle, ring, pinky)
  const indexCurledIntoPalm = euclideanDist(indexTip, wrist) < euclideanDist(indexPip, wrist) * 1.03 ||
                              euclideanDist(indexTip, indexMcp) < 0.65 * palmScale;

  // 1. Fist / Thumbs Up / Thumbs Down (All four fingers including index are curled into palm)
  if (indexCurledIntoPalm && !middleOpen && !ringOpen && !pinkyOpen) {
    const thumbDistFromPalm = euclideanDist(thumbTip, indexMcp) / palmScale;
    const thumbExtended = thumbDistFromPalm > 0.42 && euclideanDist(thumbTip, wrist) > euclideanDist(thumbMcp, wrist) * 1.10;

    if (thumbExtended) {
      // Check vertical direction: y increases downwards on screen
      const isPointingDown = thumbTip.y > thumbMcp.y && thumbTip.y > wrist.y;
      const isPointingUp = thumbTip.y < thumbMcp.y && thumbTip.y < indexMcp.y;

      if (isPointingDown) {
        return { gesture: 'thumbs_down', confidence: 0.96 };
      }
      if (isPointingUp) {
        return { gesture: 'thumbs_up', confidence: 0.96 };
      }
      return { gesture: 'thumbs_up', confidence: 0.88 };
    }

    // All four fingers curled into palm + thumb wrapped -> DEFINITIVELY FIST
    return { gesture: 'fist', confidence: 0.95 };
  }

  // 2. Korean Finger Heart (Thumb tip pinched with Index tip, Index extends outward while middle/ring/pinky remain curled)
  const thumbIndexDist = euclideanDist(thumbTip, indexTip) / palmScale;
  const indexExtendedPastMiddle = euclideanDist(indexTip, wrist) > euclideanDist(middleTip, wrist) * 1.12;

  if (thumbIndexDist < 0.42 && indexExtendedPastMiddle && !middleOpen && !ringOpen && !pinkyOpen) {
    const conf = Math.min(0.98, Math.max(0.85, 1 - thumbIndexDist * 0.5));
    return { gesture: 'finger_heart', confidence: conf };
  }

  // 4. Scissor / Peace (Index & Middle open, Ring & Pinky curled)
  if (indexOpen && middleOpen && !ringOpen && !pinkyOpen) {
    return { gesture: 'scissor', confidence: 0.96 };
  }

  // 5. Open Palm / Wave (All 4 fingers open)
  if (indexOpen && middleOpen && ringOpen && pinkyOpen) {
    return { gesture: 'palm', confidence: 0.97 };
  }

  return { gesture: 'none', confidence: 0 };
}

/**
 * State machine that debounces gestures with rapid 2-frame trigger and 1-frame grace
 */
export class GestureDebouncer {
  constructor(requiredHoldFrames = 2, cooldownMs = 2000) {
    this.requiredHoldFrames = requiredHoldFrames;
    this.cooldownMs = cooldownMs;
    this.currentCandidate = 'none';
    this.holdCount = 0;
    this.graceCount = 0;
    this.lastTriggerTime = 0;
    this.lastTriggeredGesture = 'none';
    this.lastConfidence = 0;
  }

  process(gesture, confidence) {
    const now = Date.now();
    let isTriggered = false;

    if (gesture === 'none' || confidence < 0.65) {
      if (this.graceCount > 0) {
        this.graceCount--;
        return {
          gesture: this.currentCandidate,
          confidence: this.lastConfidence,
          isTriggered: false,
          holdCount: this.holdCount
        };
      }
      this.currentCandidate = 'none';
      this.holdCount = 0;
      return { gesture: 'none', confidence: 0, isTriggered: false, holdCount: 0 };
    }

    this.graceCount = 1;
    this.lastConfidence = confidence;

    if (gesture === this.currentCandidate) {
      this.holdCount++;
    } else {
      this.currentCandidate = gesture;
      this.holdCount = 1;
    }

    if (this.holdCount >= this.requiredHoldFrames) {
      if (now - this.lastTriggerTime > this.cooldownMs || this.lastTriggeredGesture !== gesture) {
        isTriggered = true;
        this.lastTriggerTime = now;
        this.lastTriggeredGesture = gesture;
      }
    }

    return {
      gesture: this.currentCandidate,
      confidence,
      isTriggered,
      holdCount: this.holdCount
    };
  }

  reset() {
    this.currentCandidate = 'none';
    this.holdCount = 0;
    this.graceCount = 0;
    this.lastTriggerTime = 0;
    this.lastTriggeredGesture = 'none';
  }
}
