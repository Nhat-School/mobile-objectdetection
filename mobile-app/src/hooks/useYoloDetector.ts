import { useState, useRef, useCallback, useEffect } from 'react';
import { offlineModelService } from '../services/offlineModelService';
import { ObjectTracker } from '../utils/objectTracker';
import { PerformanceTracker } from '../utils/performance';
import { GestureStateMachine } from '../utils/gestureStateMachine';
import { notificationService } from '../services/notificationService';
import {
  DetectedObject,
  TrackedObject,
  TrackingStats,
  InferenceMetrics,
  GestureClass,
  GestureDetectionResult,
} from '../types/detection';
import { DEFAULT_MODEL_CONFIG } from '../constants/modelConfig';

export function useYoloDetector() {
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(
    DEFAULT_MODEL_CONFIG.laptopConfidenceThreshold
  );
  const [gestureThreshold, setGestureThreshold] = useState<number>(
    DEFAULT_MODEL_CONFIG.gestureConfidenceThreshold
  );
  const [activeTracks, setActiveTracks] = useState<TrackedObject[]>([]);
  const [activeGestureDetections, setActiveGestureDetections] = useState<DetectedObject[]>([]);
  const [trackingStats, setTrackingStats] = useState<TrackingStats>({
    currentlyInView: 0,
    totalUniqueCounted: 0,
    activeTrackIds: [],
  });
  const [metrics, setMetrics] = useState<InferenceMetrics>({
    inferenceTimeMs: 0,
    fps: 0,
  });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isModelReady, setIsModelReady] = useState<boolean>(false);

  // Gesture Action State Machine & Results
  const [gestureResult, setGestureResult] = useState<GestureDetectionResult>({
    gesture: 'none',
    confidence: 0,
    isTriggered: false,
    cooldownRemainingMs: 0,
    totalTriggerCount: 0,
  });

  // Client-side Laptop Tracker (IoU + Centroid)
  const trackerRef = useRef<ObjectTracker>(
    new ObjectTracker({
      iouThreshold: 0.25,
      maxCentroidDistance: 130,
      maxDisappearedFrames: 15,
    })
  );

  // Client-side Gesture Action State Machine & Debouncer (5-frame hold verification + 3.0s cooldown)
  const gestureStateRef = useRef<GestureStateMachine>(new GestureStateMachine());
  const perfTrackerRef = useRef<PerformanceTracker>(new PerformanceTracker());
  const triggerCounterRef = useRef<number>(0);

  // Initialize offline model on mount
  useEffect(() => {
    async function init() {
      await offlineModelService.loadModel();
      await notificationService.requestPermissions();
      setIsModelReady(true);
    }
    init();
  }, []);

  /**
   * Resets laptop tracking session, active tracks, and cumulative counts.
   */
  const resetTracker = useCallback(() => {
    trackerRef.current.reset();
    setActiveTracks([]);
    setTrackingStats(trackerRef.current.getStats());
  }, []);

  /**
   * Manually simulates a gesture trigger for instant UI / notification / vibration testing
   */
  const simulateGesture = useCallback(async (gesture: GestureClass) => {
    if (gesture === 'none') return;

    // Run 5 consecutive simulated frames through the state machine to satisfy debounce
    let result = gestureStateRef.current.processFrame(gesture, 0.95);
    for (let i = 0; i < 4; i++) {
      result = gestureStateRef.current.processFrame(gesture, 0.95);
    }

    if (result.isTriggered) {
      triggerCounterRef.current++;
      await notificationService.triggerGestureAction(gesture);
    }

    setGestureResult({
      gesture: result.gesture,
      confidence: 0.95,
      isTriggered: result.isTriggered,
      cooldownRemainingMs: result.cooldownRemainingMs,
      totalTriggerCount: triggerCounterRef.current,
    });
  }, []);

  /**
   * Runs offline detection on a static photo (detects both laptops and gestures)
   */
  const runPhotoInference = useCallback(
    async (
      imageUri: string,
      viewWidth: number,
      viewHeight: number
    ): Promise<DetectedObject[]> => {
      const startTime = Date.now();
      setIsProcessing(true);

      try {
        const detections = await offlineModelService.detectObjects(
          imageUri,
          viewWidth,
          viewHeight,
          confidenceThreshold,
          gestureThreshold
        );

        const latency = Date.now() - startTime;
        const { fps, avgLatencyMs } = perfTrackerRef.current.recordFrame(latency);
        setMetrics({ inferenceTimeMs: avgLatencyMs, fps });
        return detections;
      } catch (err) {
        console.error('Offline inference error on photo:', err);
        return [];
      } finally {
        setIsProcessing(false);
      }
    },
    [confidenceThreshold, gestureThreshold]
  );

  /**
   * Option A: Processes live camera frames detecting Laptops AND Gestures simultaneously
   */
  const processLiveFrame = useCallback(
    async (imageUri: string, viewWidth: number, viewHeight: number) => {
      if (isProcessing) return;

      const startTime = Date.now();
      setIsProcessing(true);

      try {
        // Single unified inference pass for all 6 classes
        const detections = await offlineModelService.detectObjects(
          imageUri,
          viewWidth,
          viewHeight,
          confidenceThreshold,
          gestureThreshold
        );

        // 1. Route Laptops -> Object Tracker (Anti-overcounting unique IDs)
        const laptopDetections = detections.filter(
          (d) => d.className === 'laptop' || d.classId === 0
        );
        const tracks = trackerRef.current.update(laptopDetections);
        const stats = trackerRef.current.getStats();
        setActiveTracks(tracks);
        setTrackingStats(stats);

        // 2. Route Gestures -> Gesture State Machine (Hold-verification & local notifications)
        const gestureDetections = detections.filter(
          (d) => d.className !== 'laptop' && d.classId !== 0
        );
        setActiveGestureDetections(gestureDetections);

        if (gestureDetections.length > 0) {
          // Sort by highest confidence
          gestureDetections.sort((a, b) => b.confidence - a.confidence);
          const topGesture = gestureDetections[0];
          const gestureName = topGesture.className as GestureClass;

          const gResult = gestureStateRef.current.processFrame(
            gestureName,
            topGesture.confidence
          );

          if (gResult.isTriggered) {
            triggerCounterRef.current++;
            await notificationService.triggerGestureAction(gestureName);
          }

          setGestureResult({
            gesture: gResult.gesture,
            confidence: topGesture.confidence,
            box: topGesture.box,
            isTriggered: gResult.isTriggered,
            cooldownRemainingMs: gResult.cooldownRemainingMs,
            totalTriggerCount: triggerCounterRef.current,
          });
        } else {
          const gResult = gestureStateRef.current.processFrame('none', 0);
          setGestureResult((prev: GestureDetectionResult) => ({
            ...prev,
            gesture: 'none',
            confidence: 0,
            isTriggered: false,
            cooldownRemainingMs: gResult.cooldownRemainingMs,
          }));
        }

        const latency = Date.now() - startTime;
        const { fps, avgLatencyMs } = perfTrackerRef.current.recordFrame(latency);
        setMetrics({ inferenceTimeMs: avgLatencyMs, fps });
      } catch (err) {
        console.warn('Live simultaneous inference notice:', err);
      } finally {
        setIsProcessing(false);
      }
    },
    [confidenceThreshold, gestureThreshold, isProcessing]
  );

  return {
    isModelReady,
    confidenceThreshold,
    setConfidenceThreshold,
    gestureThreshold,
    setGestureThreshold,
    activeTracks,
    activeGestureDetections,
    trackingStats,
    gestureResult,
    metrics,
    isProcessing,
    resetTracker,
    simulateGesture,
    runPhotoInference,
    processLiveFrame,
  };
}
