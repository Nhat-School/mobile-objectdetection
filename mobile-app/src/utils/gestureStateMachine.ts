import { notificationService } from '../services/notificationService';

export type GestureType =
  | 'finger_heart'
  | 'scissor'
  | 'thumbs_up'
  | 'palm'
  | 'fist'
  | 'none';

export interface GestureStateEvent {
  gesture: GestureType;
  confidence: number;
  isTriggered: boolean;
  cooldownRemainingMs: number;
}

export class GestureStateMachine {
  private activeGesture: GestureType = 'none';
  private consecutiveCount: number = 0;
  private minHoldFrames: number = 5; // ~0.35s confirmation window
  private lastTriggerTimestamp: number = 0;
  private cooldownMs: number = 3000; // 3-second anti-spam lock

  /**
   * Processes each detection frame and determines if an action notification should trigger.
   *
   * @param detectedGesture The gesture predicted by the model in the current frame
   * @param confidence Confidence score [0..1]
   * @returns GestureStateEvent containing event state and trigger status
   */
  public processFrame(
    detectedGesture: GestureType,
    confidence: number
  ): GestureStateEvent {
    const now = Date.now();
    const timeSinceLastTrigger = now - this.lastTriggerTimestamp;
    const inCooldown = timeSinceLastTrigger < this.cooldownMs;
    const cooldownRemainingMs = Math.max(0, this.cooldownMs - timeSinceLastTrigger);

    let isTriggered = false;

    if (detectedGesture === 'none' || confidence < 0.6) {
      this.consecutiveCount = 0;
      this.activeGesture = 'none';
    } else {
      if (detectedGesture === this.activeGesture) {
        this.consecutiveCount++;
      } else {
        this.activeGesture = detectedGesture;
        this.consecutiveCount = 1;
      }

      // Check if held long enough and not currently cooling down
      if (this.consecutiveCount >= this.minHoldFrames && !inCooldown) {
        this.lastTriggerTimestamp = now;
        isTriggered = true;

        switch (this.activeGesture) {
          case 'finger_heart':
            notificationService.sendHeartNotification();
            break;
          case 'scissor':
            notificationService.sendScissorNotification();
            break;
          case 'thumbs_up':
            notificationService.sendThumbsUpNotification();
            break;
          case 'palm':
            notificationService.sendPalmNotification();
            break;
          case 'fist':
            notificationService.sendFistNotification();
            break;
        }
      }
    }

    return {
      gesture: this.activeGesture,
      confidence,
      isTriggered,
      cooldownRemainingMs,
    };
  }

  public reset(): void {
    this.activeGesture = 'none';
    this.consecutiveCount = 0;
    this.lastTriggerTimestamp = 0;
  }
}
